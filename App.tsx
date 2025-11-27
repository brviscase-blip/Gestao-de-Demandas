
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

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando busca no Supabase...');

      // 1. Buscar Projetos
      const { data: projectsData, error: projectsError } = await supabase
        .from('Cadastro_de_Projetos')
        .select('*');

      // 2. Buscar Demandas (Tarefas)
      const { data: demandsData, error: demandsError } = await supabase
        .from('Cadastro_de_Demandas')
        .select('*');

      if (projectsError) {
        console.error('Erro ao buscar projetos:', JSON.stringify(projectsError, null, 2));
        alert(`Erro ao conectar no banco (Projetos): ${projectsError.message}`);
        setProjects([]);
      } else {
        // Se houver erro nas demandas, apenas loga, mas carrega os projetos
        if (demandsError) {
          console.error('Erro ao buscar demandas:', JSON.stringify(demandsError, null, 2));
        }

        const rawProjects = projectsData || [];
        const rawDemands = demandsData || [];

        const mappedProjects: Project[] = rawProjects.map((item: any) => {
          // Normalização de ID do Projeto (Converte para String para consistência)
          const projectId = String(item.id || item.id_supabase || item.ID || '');

          // Filtrar demandas deste projeto específico (Case Insensitive Check)
          const projectDemands = rawDemands.filter((d: any) => {
             // Tenta pegar o ID do projeto na demanda em várias formatações
             const demandProjectId = String(d.ID_Projeto || d.id_projeto || d.project_id || '');
             return demandProjectId === projectId;
          });

          // Agrupar demandas em Atividades (Agrupadores)
          const activitiesMap = new Map<string, Activity>();

          projectDemands.forEach((d: any) => {
            // CORREÇÃO AQUI: Mapeando colunas exatas do CSV
            // CSV: Titulo_Demanda (Agrupador)
            // CSV: Demanda_Principal (Tarefa)
            // CSV: Responsavel_ (Responsável com underline no final)
            
            // O nome do agrupador serve como ID do grupo, já que não temos ID específico no CSV
            const groupName = d.Titulo_Demanda || d.titulo_demanda || 'Geral';
            const groupId = groupName; // Usamos o nome como chave única do grupo dentro do projeto

            if (!activitiesMap.has(groupId)) {
              activitiesMap.set(groupId, {
                id: groupId,
                name: groupName,
                subActivities: []
              });
            }

            const activity = activitiesMap.get(groupId)!;
            
            // Mapear a Tarefa (SubActivity) usando as colunas corretas
            activity.subActivities.push({
              id: String(d.id || d.ID),
              name: d.Demanda_Principal || d.demanda_principal || d.Nome_Tarefa || 'Sem descrição',
              responsible: d.Responsavel_ || d.responsavel_ || d.Responsavel || 'Não atribuído',
              status: (d.Status || d.status) as TaskStatus || 'Não Iniciado',
              dmaic: (d.DMAIC || d.dmaic) as DMAICPhase || 'M - Mensurar',
              deadline: d.Data_Prazo || d.data_prazo || undefined
            });
          });

          // Calcular progresso baseado nas demandas carregadas
          const allTasks = Array.from(activitiesMap.values()).flatMap(a => a.subActivities);
          const completedTasks = allTasks.filter(t => t.status === 'Concluído').length;
          const calculatedProgress = allTasks.length > 0 
            ? Math.round((completedTasks / allTasks.length) * 100) 
            : (item.progresso || item.progress || 0);

          return {
            id: projectId,
            title: item.Nome_do_Projeto || item.nome_do_projeto || item.title || 'Sem Título',
            type: item.Tipo_do_Projeto || item.tipo_do_projeto || item.type || 'Geral',
            startDate: item.Data_de_Inicio || item.data_de_inicio || item.startDate || new Date().toISOString(),
            justification: item.Justificativa || item.justificativa || '',
            objective: item.Objetivo || item.objetivo || '',
            benefits: item.Beneficios_Esperados || item.beneficios_esperados || '',
            description: item.Objetivo || item.objetivo || '', 
            responsibleLead: item['Responsável_Principal'] || item['responsável_principal'] || item.Responsavel_Principal || item.responsavel_principal || 'Não atribuído',
            progress: calculatedProgress, 
            status: item.status || 'Ativo',
            activities: Array.from(activitiesMap.values()),
            recurrentDemands: [] // Recorrências ainda podem ser implementadas se houver tabela específica
          };
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

  const handleUpdateProject = async (updatedProject: Project) => {
    // 1. Otimistic Update (UI)
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );

    // 2. Sync to Backend (N8N)
    // Chamamos a função de edição que já possui a lógica de enviar para o Webhook de Projetos
    await handleEditProject(updatedProject);
  };

  // Nova função para enviar dados ao Webhook de Demandas
  const handleCreateDemand = async (demandData: any) => {
    try {
      if (N8N_WEBHOOK_DEMANDS_URL) {
        console.log("Enviando demanda para N8N:", demandData);
        const response = await fetch(N8N_WEBHOOK_DEMANDS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(demandData),
        });

        if (!response.ok) {
          console.error(`Erro ao enviar demanda para N8N: ${response.statusText}`);
        } else {
          console.log("Demanda enviada com sucesso para N8N");
        }
      } else {
        console.warn("URL do Webhook de Demandas não configurada.");
      }
    } catch (error) {
      console.error("Erro ao enviar demanda para N8N:", error);
    }
  };

  const handleAddProject = async (newProject: Project): Promise<boolean> => {
    try {
      if (N8N_WEBHOOK_URL) {
        const payload = {
          action: 'create',
          ...newProject
        };

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

  const handleEditProject = async (updatedProject: Project): Promise<boolean> => {
    try {
      // Se chamado diretamente (não via handleUpdateProject), atualiza estado local também
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Erro ao editar no N8N: ${response.statusText}`);
        }
      }
      return true;
    } catch (error) {
      console.error("Erro ao editar projeto:", error);
      // Não alertamos aqui se for uma atualização em background, 
      // mas como é chamado por botões explícitos, o alert é aceitável.
      return false;
    }
  };

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
          headers: {
            'Content-Type': 'application/json',
          },
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
            onCreateDemand={handleCreateDemand}
          />
        )}
      </main>
    </div>
  );
};

export default App;
