import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { Login } from './components/Login';
import { N8N_WEBHOOK_URL, N8N_WEBHOOK_DEMANDS_URL } from './constants';
import { Project, Activity, SubActivity, TaskStatus, DMAICPhase, UserProfile } from './types';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

type ViewState = 'dashboard' | 'project-list' | 'project-detail';
type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  
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

  // Carregamento Inicial
  useEffect(() => {
    // Verifica se já existe um usuário no localStorage (Opcional, para persistência simples)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    // Busca perfis para uso geral (independente do login para carregar os forms, mas poderia ser restrito)
    // Se quiser que só busque após login, mova para dentro do if(storedUser) ou handleLogin
    fetchProfiles();
    fetchProjects();
  }, []);

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    // Recarrega projetos para garantir dados frescos
    fetchProjects();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    setActiveView('dashboard');
  };

  // Buscar Lista de Perfis (Cadastro_de_Perfil)
  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from('Cadastro_de_Perfil').select('*');
      if (error) {
        console.error('Erro ao buscar perfis:', error);
      } else {
        setProfiles(data as UserProfile[]);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar perfis:', err);
    }
  };

  /**
   * Função auxiliar para buscar valor em objeto ignorando Case Sensitive.
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
   * Mapeia os dados crus vindos do banco para a interface Project
   */
  const mapSupabaseProject = (item: any): Project => {
    const id = String(item.ID_Supabase_Projetos || item.id || crypto.randomUUID());

    return {
      id: id,
      title: item.Nome_do_Projeto || item.title || 'Sem Título',
      type: item.Tipo_do_Projeto || item.type || 'Geral',
      responsibleLead: item.Responsavel || item.responsibleLead || 'Não atribuído',
      startDate: item.Data_de_Inicio || item.startDate || new Date().toISOString(),
      justification: item.Justificativa || item.justification || '',
      objective: item.Objetivo || item.objective || '',
      benefits: item.Beneficios || item.benefits || '',
      description: item.Objetivo || item.description || '', 
      progress: item.progresso || item.progress || 0,
      status: item.Status || item.status || 'Ativo',
      activities: [],
      recurrentDemands: []
    };
  };

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      const { data: projectsData, error: projectsError } = await supabase
        .from('Cadastro_de_Projeto')
        .select('*');

      const { data: demandsData, error: demandsError } = await supabase
        .from('Cadastro_de_Demanda')
        .select('*');

      if (projectsError) {
        console.error('Erro ao buscar projetos:', JSON.stringify(projectsError, null, 2));
        // Se estiver na tela de login, não mostra alert para não atrapalhar
        if (currentUser) alert(`Erro ao conectar no banco (Projetos): ${projectsError.message}`);
        setProjects([]);
      } else {
        if (demandsError) {
          console.error('Erro ao buscar demandas:', JSON.stringify(demandsError, null, 2));
        }

        const rawProjects = projectsData || [];
        const rawDemands = demandsData || [];

        const mappedProjects: Project[] = rawProjects.map((item: any) => {
          const project = mapSupabaseProject(item);

          const projectDemands = rawDemands.filter((d: any) => {
             const demandProjectId = String(getValueCI(d, ['ID_Projeto', 'id_projeto', 'project_id', 'projectId', 'Projeto']) || '');
             return demandProjectId === project.id || demandProjectId === project.title;
          });

          const activitiesMap = new Map<string, Activity>();

          projectDemands.forEach((d: any) => {
            const groupName = getValueCI(d, ['Titulo_Demanda', 'titulo_demanda', 'activityGroupName', 'Demanda_Principal']) || 'Geral';
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

  const handleUpdateProject = async (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    await handleEditProject(updatedProject);
  };

  const handleLocalUpdateProject = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleCreateDemand = async (demandData: any) => {
    try {
      if (N8N_WEBHOOK_DEMANDS_URL) {
        console.log("Enviando demanda para N8N:", demandData);
        fetch(N8N_WEBHOOK_DEMANDS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(demandData),
          keepalive: true,
        }).catch(err => console.error("Erro no envio assíncrono da demanda:", err));
      }
    } catch (error) {
      console.error("Erro ao enviar demanda para N8N:", error);
    }
  };

  const handleAddProject = async (newProject: Project): Promise<boolean> => {
    try {
      if (N8N_WEBHOOK_URL) {
        const payload = { action: 'create', ...newProject };
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Erro na integração N8N: ${response.statusText}`);
      }
      setProjects(prev => [newProject, ...prev]);
      return true;
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Houve um erro ao tentar salvar o projeto no servidor.");
      return false;
    }
  };

  const handleEditProject = async (updatedProject: Project): Promise<boolean> => {
    try {
      const oldProject = projects.find(p => p.id === updatedProject.id);
      const previousTitle = oldProject ? oldProject.title : updatedProject.title;

      setProjects(prevProjects => 
        prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
      );

      if (N8N_WEBHOOK_URL) {
        const payload = {
          action: 'update',
          ...updatedProject,
          previousTitle: previousTitle
        };
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Erro ao editar no N8N: ${response.statusText}`);
      }
      return true;
    } catch (error) {
      console.error("Erro ao editar projeto:", error);
      return false;
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    const previousProjects = [...projects];
    
    setProjects(prev => prev.filter(p => p.id !== projectId));

    try {
      if (N8N_WEBHOOK_URL) {
        const payload = {
          action: 'delete',
          id: projectId,
          title: projectToDelete ? projectToDelete.title : ''
        };
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`Erro ao excluir no N8N: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      alert("Erro ao excluir o projeto no servidor.");
      setProjects(previousProjects);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  // SE NÃO TIVER USUÁRIO LOGADO, MOSTRA LOGIN
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (isLoading && projects.length === 0 && profiles.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-brand-600" />
          <p className="font-medium animate-pulse">Carregando seus projetos...</p>
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
        user={currentUser}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 overflow-auto flex flex-col relative transition-all duration-300">
        {activeView === 'dashboard' && <Dashboard projects={projects} />}
        
        {activeView === 'project-list' && (
          <ProjectList 
            projects={projects} 
            profiles={profiles}
            onSelectProject={handleSelectProject} 
            onAddProject={handleAddProject}
            onEditProject={handleEditProject}
            onDeleteProject={handleDeleteProject}
          />
        )}
        
        {activeView === 'project-detail' && selectedProject && (
          <ProjectDetail 
            project={selectedProject} 
            profiles={profiles}
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