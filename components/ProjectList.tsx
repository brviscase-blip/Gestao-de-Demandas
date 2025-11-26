import React, { useState } from 'react';
import { Project } from '../types';
import { Plus, ChevronRight, BarChart2, X, Loader2 } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onAddProject: (project: Project) => Promise<boolean>;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onAddProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    responsibleLead: '',
    type: 'Projeto Melhoria (DMAIC)',
    startDate: new Date().toISOString().split('T')[0],
    justification: '',
    objective: '',
    benefits: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: formData.title,
      type: formData.type,
      startDate: formData.startDate,
      justification: formData.justification,
      objective: formData.objective,
      benefits: formData.benefits,
      description: formData.objective, // Usando objetivo como descrição curta
      responsibleLead: formData.responsibleLead || 'Não atribuído',
      progress: 0,
      status: 'Ativo',
      activities: [],
      recurrentDemands: []
    };

    const success = await onAddProject(newProject);
    
    setIsSubmitting(false);

    if (success) {
      // Reset e fecha modal apenas se deu certo
      setFormData({
        title: '',
        responsibleLead: '',
        type: 'Projeto Melhoria (DMAIC)',
        startDate: new Date().toISOString().split('T')[0],
        justification: '',
        objective: '',
        benefits: ''
      });
      setIsModalOpen(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm text-sm";
  const labelClass = "block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wide";

  return (
    <div className="p-8 max-w-7xl mx-auto relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Meus Projetos</h1>
          <p className="text-slate-500 mt-1">Gerencie seus projetos ativos e acompanhe o progresso.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium"
        >
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
              
              {/* Exibindo Tipo e Objetivo resumido */}
              <div className="mb-3 flex flex-wrap gap-2">
                 <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded border border-brand-100">
                   {project.type || 'Projeto Geral'}
                 </span>
                 <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                   Resp: {project.responsibleLead}
                 </span>
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                {project.objective || project.description}
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
                {project.activities.length} Atividades
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}

        {/* Add New Placeholder Card */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all min-h-[250px]"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
            <Plus size={24} />
          </div>
          <span className="font-medium">Criar novo projeto</span>
        </button>
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Novo Projeto</h2>
                <p className="text-xs text-slate-500">Preencha os detalhes para iniciar um novo projeto.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Nome do Projeto (Ocupa 2/3) */}
                <div className="md:col-span-2">
                  <label htmlFor="title" className={labelClass}>Nome do Projeto <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    id="title"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Otimização de Expedição 4.0"
                    className={inputClass}
                    disabled={isSubmitting}
                  />
                </div>

                {/* 2. Responsável (Ocupa 1/3) */}
                <div>
                  <label htmlFor="responsibleLead" className={labelClass}>Responsável Principal</label>
                  <input 
                    type="text" 
                    id="responsibleLead"
                    name="responsibleLead"
                    value={formData.responsibleLead}
                    onChange={handleChange}
                    placeholder="Ex: Rafael"
                    className={inputClass}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 3. Tipo do Projeto */}
                <div>
                  <label htmlFor="type" className={labelClass}>Tipo do Projeto</label>
                  <select 
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={isSubmitting}
                  >
                    <option value="Projeto Melhoria (DMAIC)">Projeto Melhoria (DMAIC)</option>
                    <option value="Projeto Rápido (PDCA)">Projeto Rápido (PDCA)</option>
                    <option value="Kaizen Event">Kaizen Event</option>
                    <option value="Padronização">Padronização</option>
                    <option value="Implantação de Sistema">Implantação de Sistema</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* 4. Data de Início */}
                <div>
                  <label htmlFor="startDate" className={labelClass}>Data de Início</label>
                  <input 
                    type="date" 
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={inputClass}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 5. Justificativa */}
                <div>
                  <label htmlFor="justification" className={labelClass}>
                    Justificativa (Problema)
                  </label>
                  <textarea 
                    id="justification"
                    name="justification"
                    rows={3}
                    value={formData.justification}
                    onChange={handleChange}
                    placeholder="Qual o problema atual?"
                    className={`${inputClass} resize-none`}
                    disabled={isSubmitting}
                  />
                </div>

                {/* 6. Objetivo */}
                <div>
                  <label htmlFor="objective" className={labelClass}>
                    Objetivo (Solução)
                  </label>
                  <textarea 
                    id="objective"
                    name="objective"
                    rows={3}
                    value={formData.objective}
                    onChange={handleChange}
                    placeholder="O que será feito?"
                    className={`${inputClass} resize-none`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* 7. Benefícios (Largura Total) */}
              <div>
                <label htmlFor="benefits" className={labelClass}>
                  Benefícios Esperados
                </label>
                <textarea 
                  id="benefits"
                  name="benefits"
                  rows={2}
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="Quais os ganhos esperados?"
                  className={`${inputClass} resize-none`}
                  disabled={isSubmitting}
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm text-white bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors shadow-lg shadow-brand-200 flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Criar Projeto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};