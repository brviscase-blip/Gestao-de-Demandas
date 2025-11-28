import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { N8N_WEBHOOK_URL, N8N_WEBHOOK_DEMANDS_URL } from './constants';
import { Project, Activity, SubActivity, TaskStatus, DMAICPhase } from './types';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

type ViewState = 'dashboard' | 'project-list' | 'project-detail';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as Theme) || 'light';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Busca dados do Supabase ao carregar
  useEffect(() => {
    fetchProjects();
  }, []);

  /**
   * Função auxiliar para buscar valor em objeto ignorando Case Sensitive.
   * Útil para demandas que podem ter nomes de colunas variados no Supabase.
   */
  const getValueCI = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    const objKeys = Object.keys(obj);
    for (const key of keys) {
      if (obj[key] !== undefined && obj[key] !== null) return obj[key];
      const foundKey = objKeys.find(k => k.toLowerCase() === key.toLowerCase());
      if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) return obj[foundKey];
    }
    return undefined;
  };

  /**
   * Mapeia os dados crus vindos do banco (Cadastro_de_Projetos) para a interface Project da aplicação.
   * Baseado nas colunas do arquivo CSV:
   * ID_Supabase_Projetos, Nome_do_Projeto, Tipo_do_Projeto, Responsavel, Data_de_Inicio, 
   * Justificativa, Objetivo, Beneficios, Action_Frontend
   */
  const mapSupabaseProject = (item: any): Project => {
    // Tratamento do ID: Prioriza ID_Supabase_Projetos, fallback para id
    const id = String(item.ID_Supabase_Projetos || item.id || crypto.randomUUID());

    return {
      id: id,
      title: item.Nome_do_Projeto || item.title || 'Sem Título',
      type: item.Tipo_do_Projeto || item.type || 'Geral',
      responsibleLead: item.Responsavel || item.responsibleLead || 'Não atribuído',
      startDate: item.Data_de_Inicio || item.startDate || new Date().toISOString(),
      justification: item.Justificativa || item.justification || '',
      objective: item.Objetivo || item.objective || '',
      benefits: item.Beneficios || item.benefits || '', // Mapeado para a coluna 'Beneficios'
      description: item.Objetivo || item.description || '', // Usa Objetivo como descrição se não houver descrição
      progress: item.progresso || item.progress || 0,
      status: item.Status || item.status || 'Ativo',
      activities: [], // Será populado com as demandas
      recurrentDemands: []
    };
  };

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando busca no Supabase...');

      // 1. Buscar Projetos (Tabela: Cadastro_de_Projeto)
      // FIX: Nome da tabela ajustado para singular conforme erro do Supabase
      const { data: projectsData, error: projectsError } = await supabase
        .from('Cadastro_de_Projeto')
        .select('*');

      // 2. Buscar Demandas (Tabela: Cadastro_de_Demanda)
      const { data: demandsData, error: demandsError } = await supabase
        .from('Cadastro_de_Demanda')
        .select('*');

      if (projectsError) {
        console.error('Erro ao buscar projetos:', JSON.stringify(projectsError, null, 2));
        alert(`Erro ao conectar no banco (Projetos): ${projectsError.message}`);
        setProjects([]);
      } else {
        if (demandsError) {
          console.error('Erro ao buscar demandas:', JSON.stringify(demandsError, null, 2));
        }

        const rawProjects = projectsData || [];
        const rawDemands = demandsData || [];

        const mappedProjects: Project[] = rawProjects.map((item: any) => {
          // 1. Mapeia o Projeto
          const project = mapSupabaseProject(item);

          // 2. Filtra e Mapeia as Demandas deste Projeto
          const projectDemands = rawDemands.filter((d: any) => {
             // Tenta pegar o ID do projeto na demanda.
             // O banco pode ter ID_Projeto ou project_id.
             const demandProjectId = String(getValueCI(d, ['ID_Projeto', 'id_projeto', 'project_id', 'projectId', 'Projeto']) || '');
             // Verifica por ID ou pelo Nome do Projeto (vinculo por string conforme CSV)
             return demandProjectId === project.id || demandProjectId === project.title;
          });

          // 3. Agrupa demandas em Atividades
          const activitiesMap = new Map<string, Activity>();

          projectDemands.forEach((d: any) => {
            const groupName = getValueCI(d, ['Titulo_Demanda', 'titulo_demanda', 'activityGroupName', 'Demanda_Principal']) || 'Geral';
            // Usamos o nome do grupo como ID único dentro do escopo do projeto visualmente
            const groupId = groupName;

            if (!activitiesMap.has(groupId)) {
              activitiesMap.set(groupId, {
                id: groupId,
                name: groupName,
                subActivities: []
              });
            }

            const activity = activitiesMap.get(groupId)!;
            
            const subId = String(getValueCI(d, ['id', 'ID', 'taskId', 'ID_WebHook_Edição']) || crypto.randomUUID());
            // CORREÇÃO: Prioriza Sub_Demanda para o nome da tarefa e remove Demanda_Principal da busca para evitar duplicidade com o nome do grupo
            const subName = getValueCI(d, ['Sub_Demanda', 'sub_demanda', 'taskName', 'Nome_Tarefa']) || 'Sem descrição';
            const subResponsible = getValueCI(d, ['Responsavel_', 'responsavel_', 'responsible', 'Responsavel']) || 'Não atribuído';
            const subStatus = getValueCI(d, ['Status', 'status']) as TaskStatus || 'Não Iniciado';
            const subDmaic = getValueCI(d, ['DMAIC', 'dmaic', 'Dmaic']) as DMAICPhase || 'M - Mensurar';
            const subDeadline = getValueCI(d, ['Data_Prazo', 'data_prazo', 'deadline', 'Prazo']);

            activity.subActivities.push({
              id: subId,
              name: subName,
              responsible: subResponsible,
              status: subStatus,
              dmaic: subDmaic,
              deadline: subDeadline
            });
          });

          // 4. Calcula progresso se não vier do banco
          const allTasks = Array.from(activitiesMap.values()).flatMap(a => a.subActivities);
          const completedTasks = allTasks.filter(t => t.status === 'Concluído').length;
          
          if (allTasks.length > 0) {
            project.progress = Math.round((completedTasks / allTasks.length) * 100);
          }

          project.activities = Array.from(activitiesMap.values());
          return project;
        });

        setProjects(mappedProjects);
      }
    } catch (err) {
      console.error('Erro inesperado na aplicação:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveView('project-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setActiveView('project-list');
  };

  // Função para atualização completa (Visual + Webhook de Projeto)
  const handleUpdateProject = async (updatedProject: Project) => {
    // 1. Optimistic Update (UI)
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );

    // 2. Sync to Backend (N8N - Projeto)
    await handleEditProject(updatedProject);
  };

  // Função SOMENTE para atualização LOCAL (Visual)
  const handleLocalUpdateProject = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  // Enviar dados ao Webhook de Demandas (Cadastro_de_Demandas)
  const handleCreateDemand = async (demandData: any) => {
    try {
      if (N8N_WEBHOOK_DEMANDS_URL) {
        console.log("Enviando demanda para N8N:", demandData);
        // Fire and forget com keepalive: true para garantir envio em background sem bloqueios
        fetch(N8N_WEBHOOK_DEMANDS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(demandData),
          keepalive: true, // Garante que a requisição continue mesmo se o componente desmontar ou a thread estiver ocupada
        }).catch(err => console.error("Erro no envio assíncrono da demanda:", err));
      } else {
        console.warn("URL do Webhook de Demandas não configurada.");
      }
    } catch (error) {
      console.error("Erro ao enviar demanda para N8N:", error);
    }
  };

  // Adicionar Projeto (Cadastro_de_Projetos)
  const handleAddProject = async (newProject: Project): Promise<boolean> => {
    try {
      if (N8N_WEBHOOK_URL) {
        // O n8n espera chaves em inglês no body para mapear para as colunas em português
        const payload = {
          action: 'create',
          ...newProject
        };

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Erro na integração N8N: ${response.statusText}`);
        }
      } else {
        console.warn("URL do Webhook N8N não configurada em constants.ts.");
      }
      setProjects(prev => [newProject, ...prev]);
      return true;

    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Houve um erro ao tentar salvar o projeto no servidor. Verifique o console.");
      return false;
    }
  };

  // Editar Projeto (Cadastro_de_Projetos)
  const handleEditProject = async (updatedProject: Project): Promise<boolean> => {
    try {
      // Atualiza estado local
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
      );

      if (N8N_WEBHOOK_URL) {
        const payload = {
          action: 'update',
          ...updatedProject
        };
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Erro ao editar no N8N: ${response.statusText}`);
        }
      }
      return true;
    } catch (error) {
      console.error("Erro ao editar projeto:", error);
      return false;
    }
  };

  // Excluir Projeto
  const handleDeleteProject = async (projectId: string) => {
    const previousProjects = [...projects];
    setProjects(prev => prev.filter(p => p.id !== projectId));

    try {
      if (N8N_WEBHOOK_URL) {
        const payload = {
          action: 'delete',
          id: projectId
        };
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Erro ao excluir no N8N: ${response.statusText}`);
        }
      }
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      alert("Erro ao excluir o projeto no servidor. A ação será desfeita localmente.");
      setProjects(previousProjects);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-brand-600" />
          <p className="font-medium animate-pulse">Carregando seus projetos...</p>
          <p className="text-xs text-slate-400 max-w-xs text-center">Conectando ao Supabase para buscar dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar 
        activeView={activeView} 
        onChangeView={(view) => {
          setActiveView(view);
          setSelectedProjectId(null);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 overflow-auto flex flex-col relative transition-all duration-300">
        {activeView === 'dashboard' && <Dashboard projects={projects} />}
        
        {activeView === 'project-list' && (
          <ProjectList 
            projects={projects} 
            onSelectProject={handleSelectProject} 
            onAddProject={handleAddProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
        
        {activeView === 'project-detail' && selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            onBack={handleBackToProjects}
            onUpdateProject={handleUpdateProject}
            onLocalUpdateProject={handleLocalUpdateProject}
            onCreateDemand={handleCreateDemand}
          />
        )}
      </main>
    </div>
  );
};

export default App;