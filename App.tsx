import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { INITIAL_PROJECTS, N8N_WEBHOOK_URL } from './constants';
import { Project } from './types';

type ViewState = 'dashboard' | 'project-list' | 'project-detail';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveView('project-detail');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setActiveView('project-list');
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
  };

  const handleAddProject = async (newProject: Project): Promise<boolean> => {
    try {
      // 1. Tenta enviar para o N8N se a URL estiver configurada
      if (N8N_WEBHOOK_URL) {
        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newProject),
        });

        if (!response.ok) {
          throw new Error(`Erro na integração N8N: ${response.statusText}`);
        }
        
        console.log("Projeto enviado com sucesso para o N8N!");
      } else {
        console.warn("URL do Webhook N8N não configurada em constants.ts. Salvando apenas localmente.");
      }

      // 2. Atualiza o estado local para o usuário ver instantaneamente (Optimistic Update)
      // Idealmente, depois você recarregaria a lista do banco de dados (Supabase)
      setProjects(prev => [...prev, newProject]);
      return true;

    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Houve um erro ao tentar salvar o projeto no servidor. Verifique o console.");
      return false;
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        onChangeView={(view) => {
          setActiveView(view);
          setSelectedProjectId(null);
        }}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 overflow-auto flex flex-col relative transition-all duration-300">
        {activeView === 'dashboard' && <Dashboard projects={projects} />}
        
        {activeView === 'project-list' && (
          <ProjectList 
            projects={projects} 
            onSelectProject={handleSelectProject} 
            onAddProject={handleAddProject}
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