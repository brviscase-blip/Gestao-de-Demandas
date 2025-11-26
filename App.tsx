
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { N8N_WEBHOOK_URL } from './constants';
import { Project } from './types';
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

      const { data, error } = await supabase
        .from('gestão_de_demandas')
        .select('*');

      if (error) {
        console.error('Erro detalhado do Supabase:', JSON.stringify(error, null, 2));
        alert(`Erro ao conectar no banco: ${error.message}`);
        setProjects([]);
      } else if (data) {
        const mappedProjects: Project[] = data.map((item: any) => {
          return {
            id: item.id || crypto.randomUUID(),
            title: item.Nome_do_Projeto || item.nome_do_projeto || 'Sem Título',
            type: item.Tipo_do_Projeto || item.tipo_do_projeto || 'Geral',
            startDate: item.Data_de_Inicio || item.data_de_inicio || new Date().toISOString(),
            justification: item.Justificativa || item.justificativa || '',
            objective: item.Objetivo || item.objetivo || '',
            benefits: item.Beneficios_Esperados || item.beneficios_esperados || '',
            description: item.Objetivo || item.objetivo || '', 
            responsibleLead: item['Responsável_Principal'] || item['responsável_principal'] || item.Responsavel_Principal || 'Não atribuído',
            progress: 0, 
            status: 'Ativo',
            activities: [],
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
    // Chamamos a função de edição que já possui a lógica de enviar para o Webhook
    await handleEditProject(updatedProject);
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
          />
        )}
      </main>
    </div>
  );
};

export default App;
