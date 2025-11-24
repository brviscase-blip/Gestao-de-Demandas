import React from 'react';
import { Project } from '../types';
import { Plus, ChevronRight, BarChart2 } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Projetos</h1>
          <p className="text-slate-500 mt-1">Gerencie seus projetos ativos e acompanhe o progresso.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium">
          <Plus size={20} className="mr-2" />
          Novo Projeto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => onSelectProject(project.id)}
            className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-200 transition-all cursor-pointer overflow-hidden flex flex-col h-full"
          >
            <div className="p-6 flex-1">
              <div className="flex justify-between items-start mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  project.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {project.status}
                </span>
                <span className="text-xs text-slate-400">Início: {new Date(project.startDate).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">
                {project.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {project.description}
              </p>
              
              <div className="mt-auto">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Progresso</span>
                  <span className="text-slate-900 font-bold">{project.progress}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className="bg-brand-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center text-xs text-slate-500">
                <BarChart2 size={14} className="mr-1" />
                {project.activities.length} Atividades Principais
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}

        {/* Add New Placeholder Card */}
        <button className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-white">
            <Plus size={24} />
          </div>
          <span className="font-medium">Criar novo projeto</span>
        </button>
      </div>
    </div>
  );
};