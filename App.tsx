
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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Busca dados do Supabase ao carregar
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      
      console.log('Iniciando busca no Supabase...');

      // Seleciona todas as colunas da tabela 'gestão_de_demandas'
      // Removida ordenação por 'created_at' para evitar erros se a coluna não existir
      const { data, error } = await supabase
        .from('gestão_de_demandas')
        .select('*');

      if (error) {
        console.error('Erro detalhado do Supabase:', JSON.stringify(error, null, 2));
        alert(`Erro ao conectar no banco: ${error.message}`);
        setProjects([]);
      } else if (data) {
        console.log('Dados brutos recebidos do Supabase:', data);

        // Mapeia do formato do Banco de Dados para o Frontend
        // Usa fallback para lidar com variações de Maiúsculas/Minúsculas e Acentos
        const mappedProjects: Project[] = data.map((item: any) => {
          // Helper para pegar valor ignorando case/acentos se necessário, 
          // mas priorizando os nomes exatos fornecidos
          
          return {
            id: item.id || crypto.randomUUID(),
            // Tenta variações comuns de nome de coluna
            title: item.Nome_do_Projeto || item.nome_do_projeto || 'Sem Título',
            type: item.Tipo_do_Projeto || item.tipo_do_projeto || 'Geral',
            startDate: item.Data_de_Inicio || item.data_de_inicio || new Date().toISOString(),
            justification: item.Justificativa || item.justificativa || '',
            objective: item.Objetivo || item.objetivo || '',
            benefits: item.Beneficios_Esperados || item.beneficios_esperados || '',
            description: item.Objetivo || item.objetivo || '', 
            
            // Acesso seguro a propriedades com acentos
            responsibleLead: item['Responsável_Principal'] || item['responsável_principal'] || item.Responsavel_Principal || 'Não atribuído',
            
            progress: 0, 
            status: 'Ativo',
            activities: [],
            recurrentDemands: []
          };
        });
        
        console.log('Projetos mapeados:', mappedProjects);
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

  const handleUpdateProject = (updatedProject: Project) => {
    // Atualiza estado local
    setProjects(prevProjects => 
      prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p)
    );
    
    // TODO: Futuramente, implementar a atualização no Supabase aqui também
    // supabase.from('gestão_de_demandas').update({ ... }).eq('id', updatedProject.id)
  };

  const handleAddProject = async (newProject: Project): Promise<boolean> => {
    try {
      // 1. Tenta enviar para o N8N se a URL estiver configurada
      // O N8N cuidará de inserir no Supabase
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
        console.warn("URL do Webhook N8N não configurada em constants.ts.");
      }

      // 2. Atualiza o estado local (Optimistic UI)
      setProjects(prev => [newProject, ...prev]);
      return true;

    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Houve um erro ao tentar salvar o projeto no servidor. Verifique o console.");
      return false;
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-600">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-brand-600" />
          <p className="font-medium animate-pulse">Carregando seus projetos...</p>
          <p className="text-xs text-slate-400 max-w-xs text-center">Conectando ao Supabase para buscar dados da tabela 'gestão_de_demandas'</p>
        </div>
      </div>
    );
  }

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
