
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

// Função auxiliar para buscar valor em objeto ignorando Case Sensitive (Maiúsculas/Minúsculas)
const getValueCI = (obj: any, keys: string[]) => {
  if (!obj) return undefined;
  const objKeys = Object.keys(obj);
  
  for (const key of keys) {
    // 1. Tentativa Exata
    if (obj[key] !== undefined && obj[key] !== null) return obj[key];
    
    // 2. Tentativa Case Insensitive
    const foundKey = objKeys.find(k => k.toLowerCase() === key.toLowerCase());
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) return obj[foundKey];
  }
  return undefined;
};

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
          const projectId = String(getValueCI(item, ['id', 'ID', 'id_supabase', 'ID_Projeto']) || '');

          // Filtrar demandas deste projeto específico (Case Insensitive Check)
          const projectDemands = rawDemands.filter((d: any) => {
             // Tenta pegar o ID do projeto na demanda em várias formatações
             const demandProjectId = String(getValueCI(d, ['ID_Projeto', 'id_projeto', 'project_id', 'projectId']) || '');
             return demandProjectId === projectId;
          });

          // Agrupar demandas em Atividades (Agrupadores)
          const activitiesMap = new Map<string, Activity>();

          projectDemands.forEach((d: any) => {
            // Mapeando colunas com a função auxiliar (Case Insensitive)
            // Isso garante que se o banco retornar 'titulo_demanda' ou 'Titulo_Demanda', ambos funcionam.
            const groupName = getValueCI(d, ['Titulo_Demanda', 'titulo_demanda', 'activityGroupName']) || 'Geral';
            const groupId = groupName; // Usamos o nome como chave única do grupo dentro do projeto

            if (!activitiesMap.has(groupId)) {
              activitiesMap.set(groupId, {
                id: groupId,
                name: groupName,
                subActivities: []
              });
            }

            const activity = activitiesMap.get(groupId)!;
            
            // Extraindo valores das colunas com segurança usando getValueCI em TODOS os campos
            const subId = String(getValueCI(d, ['id', 'ID', 'taskId']) || crypto.randomUUID());
            const subName = getValueCI(d, ['Demanda_Principal', 'demanda_principal', 'taskName', 'Nome_Tarefa']) || 'Sem descrição';
            const subResponsible = getValueCI(d, ['Responsavel_', 'responsavel_', 'responsible', 'Responsavel']) || 'Não atribuído';
            const subStatus = getValueCI(d, ['Status', 'status']) as TaskStatus || 'Não Iniciado';
            const subDmaic = getValueCI(d, ['DMAIC', 'dmaic']) as DMAICPhase || 'M - Mensurar';
            const subDeadline = getValueCI(d, ['Data_Prazo', 'data_prazo', 'deadline']);

            // Mapear a Tarefa (SubActivity)
            activity.subActivities.push({
              id: subId,
              name: subName,
              responsible: subResponsible,
              status: subStatus,
              dmaic: subDmaic,
              deadline: subDeadline
            });
          });

          // Calcular progresso baseado nas demandas carregadas
          const allTasks = Array.from(activitiesMap.values()).flatMap(a => a.subActivities);
          const completedTasks = allTasks.filter(t => t.status === 'Concluído').length;
          const calculatedProgress = allTasks.length > 0 
            ? Math.round((completedTasks / allTasks.length) * 100) 
            : (getValueCI(item, ['progresso', 'progress']) || 0);

          return {
            id: projectId,
            title: getValueCI(item, ['Nome_do_Projeto', 'nome_do_projeto', 'title']) || 'Sem Título',
            type: getValueCI(item, ['Tipo_do_Projeto', 'tipo_do_projeto', 'type']) || 'Geral',
            startDate: getValueCI(item, ['Data_de_Inicio', 'data_de_inicio', 'startDate']) || new Date().toISOString(),
            justification: getValueCI(item, ['Justificativa', 'justificativa']) || '',
            objective: getValueCI(item, ['Objetivo', 'objetivo']) || '',
            benefits: getValueCI(item, ['Beneficios_Esperados', 'beneficios_esperados', 'benefits']) || '',
            description: getValueCI(item, ['Objetivo', 'objetivo', 'description']) || '', 
            responsibleLead: getValueCI(item, ['Responsavel_Principal', 'responsavel_principal', 'responsibleLead']) || 'Não atribuído',
            progress: calculatedProgress, 
            status: getValueCI(item, ['status', 'Status']) || 'Ativo',
            activities: Array.from(activitiesMap.values()),
            recurrentDemands: [] 
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
