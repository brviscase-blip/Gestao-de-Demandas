
import React, { useState } from 'react';
import { Project } from '../types';
import { Plus, ChevronRight, BarChart2, X, Loader2, Trash2, Pencil, AlertTriangle, ChevronDown, FolderPlus, FolderKanban } from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  onAddProject: (project: Project) => Promise<boolean>;
  onEditProject: (project: Project) => Promise<boolean>;
  onDeleteProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects, onSelectProject, onAddProject, onEditProject, onDeleteProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // State para o Modal de Exclusão
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    responsibleLead: '',
    type: 'Automação / Digitalização',
    startDate: new Date().toISOString().split('T')[0],
    justification: '',
    objective: '',
    benefits: ''
  });

  const hasProjects = projects.length > 0;

  // Função para abrir modal em modo CRIAÇÃO
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      responsibleLead: '',
      type: 'Automação / Digitalização',
      startDate: new Date().toISOString().split('T')[0],
      justification: '',
      objective: '',
      benefits: ''
    });
    setIsModalOpen(true);
  };

  // Função para abrir modal em modo EDIÇÃO
  const handleOpenEditModal = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setEditingProject(project);
    setFormData({
      title: project.title,
      responsibleLead: project.responsibleLead,
      type: project.type,
      startDate: project.startDate ? project.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
      justification: project.justification || '',
      objective: project.objective || '',
      benefits: project.benefits || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let success = false;

    if (editingProject) {
      // MODO EDIÇÃO
      const updatedProject: Project = {
        ...editingProject,
        title: formData.title,
        type: formData.type,
        startDate: formData.startDate,
        justification: formData.justification,
        objective: formData.objective,
        benefits: formData.benefits,
        description: formData.objective,
        responsibleLead: formData.responsibleLead || 'Não atribuído',
      };
      success = await onEditProject(updatedProject);
    } else {
      // MODO CRIAÇÃO
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
      success = await onAddProject(newProject);
    }
    
    setIsSubmitting(false);

    if (success) {
      setIsModalOpen(false);
      setEditingProject(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteClick = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation(); // Impede que o clique abra o projeto
    setProjectToDelete(projectId);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  // Estilos atualizados para maior conforto visual e compactação
  const inputClass = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm font-medium text-sm";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide";

  return (
    <div className="p-8 max-w-7xl mx-auto relative h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0 z-10 relative">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Meus Projetos</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie seus projetos ativos e acompanhe o progresso.</p>
        </div>
        
        {/* Só mostra o botão superior se JÁ existirem projetos na tela */}
        {hasProjects && (
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors shadow-sm font-medium"
          >
            <Plus size={20} className="mr-2" />
            Novo Projeto
          </button>
        )}
      </div>

      {!hasProjects ? (
        // === EMPTY STATE PREENCHIDO COM GHOST GRID ===
        <div className="flex-1 relative">
           
           {/* Fundo com "Fantasmas" (Ghost Cards) para preencher o ambiente */}
           <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-30 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 flex flex-col p-6">
                    <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="mt-auto h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
              ))}
           </div>

           {/* Card Central de Ação (Overlay) */}
           <div className="relative z-10 flex flex-col items-center justify-center h-full">
             <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-10 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl text-center max-w-lg w-full transform transition-all hover:scale-105 duration-300">
                <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/30 rounded-full flex items-center justify-center mb-6 mx-auto shadow-sm border border-brand-100 dark:border-brand-800 text-brand-500">
                  <FolderPlus size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nenhum projeto encontrado</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                  Parece que você ainda não tem nenhum projeto cadastrado.
                  O ambiente está pronto para suas iniciativas.
                </p>
                
                <button 
                  onClick={handleOpenCreateModal}
                  className="w-full flex items-center justify-center px-6 py-3.5 bg-brand-600 text-white text-base rounded-xl hover:bg-brand-700 hover:shadow-lg hover:shadow-brand-200 dark:hover:shadow-brand-900 transition-all font-bold"
                >
                  <Plus size={20} className="mr-2" />
                  Criar Primeiro Projeto
                </button>
             </div>
           </div>
        </div>
      ) : (
        // === GRID DE PROJETOS ===
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in relative z-10">
          {projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => onSelectProject(project.id)}
              className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition-all cursor-pointer overflow-hidden flex flex-col h-full relative"
            >
               {/* Ações (Editar / Excluir) */}
               <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                    onClick={(e) => handleOpenEditModal(e, project)}
                    className="p-1.5 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/50 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors shadow-sm"
                    title="Editar projeto"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, project.id)}
                    className="p-1.5 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 border border-slate-200 dark:border-slate-600 rounded-lg transition-colors shadow-sm"
                    title="Excluir projeto"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>

              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4 pr-16">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    project.status === 'Ativo' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-slate-400">Início: {new Date(project.startDate).toLocaleDateString('pt-BR')}</span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 transition-colors pr-2">
                  {project.title}
                </h3>
                
                {/* Exibindo Tipo e Objetivo resumido */}
                <div className="mb-3 flex flex-wrap gap-2">
                   <span className="text-xs font-medium text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded border border-brand-100 dark:border-brand-800 truncate max-w-full">
                     {project.type || 'Projeto Geral'}
                   </span>
                   <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                     Resp: {project.responsibleLead}
                   </span>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                  {project.objective || project.description}
                </p>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">Progresso</span>
                    <span className="text-slate-900 dark:text-slate-200 font-bold">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-brand-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400">
                  <BarChart2 size={14} className="mr-1" />
                  {project.activities.length} Atividades
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}

          {/* Card Placeholder para Adicionar Novo (apenas se já houver projetos) */}
          <button 
            onClick={handleOpenCreateModal}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 hover:border-brand-400 dark:hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all min-h-[250px]"
          >
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4 group-hover:bg-white dark:group-hover:bg-slate-600 transition-colors">
              <Plus size={24} />
            </div>
            <span className="font-medium">Criar novo projeto</span>
          </button>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO COMPACTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                  {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {editingProject ? 'Atualize as informações estratégicas.' : 'Preencha os detalhes para iniciar.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                disabled={isSubmitting}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* BLOCO 1: Título do Projeto (Full Width) */}
              <div>
                <label htmlFor="title" className={labelClass}>Nome do Projeto <span className="text-brand-600">*</span></label>
                <input 
                  type="text" 
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Otimização de Expedição 4.0"
                  className={`${inputClass} font-semibold`}
                  disabled={isSubmitting}
                />
              </div>

              {/* BLOCO 2: Linha de 3 colunas (Tipo | Responsável | Data) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Tipo do Projeto */}
                <div className="md:col-span-1">
                  <label htmlFor="type" className={labelClass}>Tipo do Projeto</label>
                  <div className="relative">
                    <select 
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className={`${inputClass} appearance-none cursor-pointer`}
                      disabled={isSubmitting}
                    >
                      <option value="Automação / Digitalização">Automação / Digitalização</option>
                      <option value="Segurança & Ergonomia">Segurança & Ergonomia</option>
                      <option value="Fluxo de Informações & Padronização">Fluxo de Informações & Padronização</option>
                      <option value="Engajamento & Cultura">Engajamento & Cultura</option>
                      <option value="Redução de Variabilidade (Six Sigma)">Redução de Variabilidade (Six Sigma)</option>
                      <option value="Outro">Outro</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Responsável */}
                <div className="md:col-span-1">
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

                {/* Data de Início */}
                <div className="md:col-span-1">
                  <label htmlFor="startDate" className={labelClass}>Data de Início</label>
                  <input 
                    type="date" 
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className={`${inputClass} dark:[color-scheme:dark]`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* SEPARADOR VISUAL */}
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 bg-brand-500 rounded-full"></div>
                  Detalhamento Estratégico
                </h3>

                <div className="grid gap-4">
                  {/* Justificativa */}
                  <div>
                    <label htmlFor="justification" className={labelClass}>
                      Justificativa (Qual o problema atual?)
                    </label>
                    <textarea 
                      id="justification"
                      name="justification"
                      rows={2}
                      value={formData.justification}
                      onChange={handleChange}
                      placeholder="Descreva o problema ou dor atual..."
                      className={`${inputClass} resize-none`}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Objetivo */}
                  <div>
                    <label htmlFor="objective" className={labelClass}>
                      Objetivo (Qual a solução proposta?)
                    </label>
                    <textarea 
                      id="objective"
                      name="objective"
                      rows={2}
                      value={formData.objective}
                      onChange={handleChange}
                      placeholder="O que será feito para mitigar o problema?"
                      className={`${inputClass} resize-none`}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Benefícios */}
                  <div>
                    <label htmlFor="benefits" className={labelClass}>
                      Benefícios Esperados (Ganhos)
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
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors shadow-lg shadow-brand-200 dark:shadow-none flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    editingProject ? 'Salvar Alterações' : 'Criar Projeto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CUSTOMIZADO DE EXCLUSÃO */}
      {projectToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Projeto?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Esta ação não pode ser desfeita. O projeto será removido permanentemente do banco de dados.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
