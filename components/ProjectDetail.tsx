import React, { useState } from 'react';
import { Project, SubActivity, TaskStatus, RecurrentMonthStatus, DMAICPhase } from '../types';
import { MONTHS, STATUS_COLORS, DMAIC_COLORS } from '../constants';
import { ArrowLeft, Plus, Calendar, List, Trello, Clock, Target, TrendingUp, AlertTriangle, X, Save, ChevronDown, ChevronRight, User, CalendarDays, Tag, Activity, Briefcase } from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'kanban' | 'recurrent'>('list');
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  
  // State for Task Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetActivity, setTargetActivity] = useState<{id: string, name: string} | null>(null);
  
  const [formData, setFormData] = useState({
    activityName: '',
    taskName: '',
    responsible: 'Rafael',
    dmaic: 'M - Mensurar' as DMAICPhase,
    status: 'Não Iniciado' as TaskStatus,
    deadline: ''
  });

  const toggleActivity = (id: string) => {
    setExpandedActivities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Helper function to calculate progress
  const calculateProgress = (activities: any[]) => {
    const allSubs = activities.flatMap(a => a.subActivities);
    const completed = allSubs.filter((s: any) => s.status === 'Concluído').length;
    return allSubs.length > 0 ? Math.round((completed / allSubs.length) * 100) : 0;
  };

  // Helper to update a task status
  const handleStatusChange = (activityId: string, subActivityId: string, newStatus: TaskStatus) => {
    const updatedActivities = project.activities.map(act => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        subActivities: act.subActivities.map(sub => {
          if (sub.id !== subActivityId) return sub;
          return { ...sub, status: newStatus };
        })
      };
    });
    
    onUpdateProject({ ...project, activities: updatedActivities, progress: calculateProgress(updatedActivities) });
  };

  // Helper to update responsible inline
  const handleResponsibleChange = (activityId: string, subActivityId: string, newResponsible: string) => {
    const updatedActivities = project.activities.map(act => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        subActivities: act.subActivities.map(sub => {
          if (sub.id !== subActivityId) return sub;
          return { ...sub, responsible: newResponsible };
        })
      };
    });
    onUpdateProject({ ...project, activities: updatedActivities });
  };

  // Helper to update DMAIC inline
  const handleDmaicChange = (activityId: string, subActivityId: string, newDmaic: DMAICPhase) => {
    const updatedActivities = project.activities.map(act => {
      if (act.id !== activityId) return act;
      return {
        ...act,
        subActivities: act.subActivities.map(sub => {
          if (sub.id !== subActivityId) return sub;
          return { ...sub, dmaic: newDmaic };
        })
      };
    });
    onUpdateProject({ ...project, activities: updatedActivities });
  };

  const handleRecurrentToggle = (demandId: string, monthIndex: number) => {
    const updatedRecurrent = project.recurrentDemands.map(rd => {
      if (rd.id !== demandId) return rd;
      const newData = [...rd.data];
      const currentStatus = newData[monthIndex].status;
      
      let nextStatus: RecurrentMonthStatus['status'] = 'OK';
      if (currentStatus === 'OK') nextStatus = 'X';
      else if (currentStatus === 'X') nextStatus = '-';
      else if (currentStatus === '-') nextStatus = 'PENDING';
      else nextStatus = 'OK';

      newData[monthIndex] = { ...newData[monthIndex], status: nextStatus };
      return { ...rd, data: newData };
    });
    onUpdateProject({ ...project, recurrentDemands: updatedRecurrent });
  };

  // Modal Functions
  const handleOpenNewActivity = () => {
    setTargetActivity(null);
    setFormData({
      activityName: '',
      taskName: '',
      responsible: 'Rafael',
      dmaic: 'M - Mensurar',
      status: 'Não Iniciado',
      deadline: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenNewTask = (activityId: string, activityName: string) => {
    // Ensure the activity is expanded when adding a task
    setExpandedActivities(prev => ({ ...prev, [activityId]: true }));
    
    setTargetActivity({ id: activityId, name: activityName });
    setFormData({
      activityName: activityName,
      taskName: '',
      responsible: 'Rafael',
      dmaic: 'I - Implementar',
      status: 'Não Iniciado',
      deadline: ''
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    let updatedActivities;

    if (targetActivity) {
        // Add task to existing activity
        updatedActivities = project.activities.map(act => {
            if (act.id === targetActivity.id) {
                return {
                    ...act,
                    subActivities: [...act.subActivities, {
                        id: crypto.randomUUID(),
                        name: formData.taskName,
                        responsible: formData.responsible,
                        dmaic: formData.dmaic,
                        status: formData.status,
                        deadline: formData.deadline
                    }]
                };
            }
            return act;
        });
    } else {
        // Create new activity + task
        const newId = crypto.randomUUID();
        const newActivity = {
            id: newId,
            name: formData.activityName,
            subActivities: [{
                id: crypto.randomUUID(),
                name: formData.taskName,
                responsible: formData.responsible,
                dmaic: formData.dmaic,
                status: formData.status,
                deadline: formData.deadline
            }]
        };
        updatedActivities = [...project.activities, newActivity];
        // Auto expand new activity
        setExpandedActivities(prev => ({ ...prev, [newId]: true }));
    }
    
    onUpdateProject({ ...project, activities: updatedActivities, progress: calculateProgress(updatedActivities) });
    setIsModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm font-medium";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
      {/* Header Melhorado */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 transition-colors">
        {/* Barra de Topo - Apenas Voltar */}
        <div className="px-8 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
            <button onClick={onBack} className="flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors group">
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar para Projetos
            </button>
        </div>

        {/* Área Principal do Header */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Coluna da Esquerda: Título, Meta Info e Cards Estratégicos */}
            <div className="lg:col-span-9 flex flex-col gap-4">
              
              {/* LINHA 1: Título e Meta Dados em GRID */}
              <div className="grid grid-cols-12 gap-4">
                
                {/* Título - Ocupa 4 colunas (1/3) */}
                <div className="col-span-12 xl:col-span-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Projeto</span>
                   <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate" title={project.title}>
                    {project.title}
                   </h1>
                </div>

                {/* Meta Dados - Distribuidos no restante */}
                
                {/* Responsável */}
                <div className="col-span-6 md:col-span-3 xl:col-span-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Responsável</span>
                   </div>
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate" title={project.responsibleLead}>
                      {project.responsibleLead}
                   </div>
                </div>

                {/* Data */}
                <div className="col-span-6 md:col-span-3 xl:col-span-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1">
                      <CalendarDays size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Início</span>
                   </div>
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                      {new Date(project.startDate).toLocaleDateString('pt-BR')}
                   </div>
                </div>

                {/* Status */}
                <div className={`col-span-6 md:col-span-3 xl:col-span-2 border rounded-xl p-3 flex flex-col justify-center ${project.status === 'Ativo' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
                   <div className="flex items-center gap-2 mb-1">
                      <Activity size={14} className={project.status === 'Ativo' ? 'text-green-500' : 'text-yellow-500'} />
                      <span className={`text-[10px] font-bold uppercase ${project.status === 'Ativo' ? 'text-green-600/70 dark:text-green-400/70' : 'text-yellow-600/70 dark:text-yellow-400/70'}`}>Status</span>
                   </div>
                   <div className={`font-bold text-sm ${project.status === 'Ativo' ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                      {project.status}
                   </div>
                </div>

                {/* Tipo */}
                <div className="col-span-6 md:col-span-3 xl:col-span-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1">
                      <Tag size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo</span>
                   </div>
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate" title={project.type}>
                      {project.type || 'Geral'}
                   </div>
                </div>

              </div>

              {/* LINHA 2: Cards Estratégicos (Aumentados) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-orange-200 hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-colors flex flex-col min-h-[220px] h-full">
                   <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase mb-3 pb-2 border-b border-orange-100/50 dark:border-orange-900/50">
                     <AlertTriangle size={14} /> Justificativa (Problema)
                   </div>
                   <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                     {project.justification || <span className="text-slate-400 italic">Não informado</span>}
                   </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-blue-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors flex flex-col min-h-[220px] h-full">
                   <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase mb-3 pb-2 border-b border-blue-100/50 dark:border-blue-900/50">
                     <Target size={14} /> Objetivo (Solução)
                   </div>
                   <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                     {project.objective || project.description || <span className="text-slate-400 italic">Não informado</span>}
                   </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-green-200 hover:bg-green-50/30 dark:hover:bg-green-900/20 transition-colors flex flex-col min-h-[220px] h-full">
                   <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase mb-3 pb-2 border-b border-green-100/50 dark:border-green-900/50">
                     <TrendingUp size={14} /> Benefícios Esperados
                   </div>
                   <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                     {project.benefits || <span className="text-slate-400 italic">Não informado</span>}
                   </p>
                </div>
              </div>
            </div>

            {/* Coluna da Direita: Card de Progresso (Ocupa Altura Total) */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm p-6 h-full flex flex-col justify-center items-center relative overflow-hidden min-h-[250px]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-500"></div>
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Progresso Geral</h3>
                
                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle
                      className="text-slate-100 dark:text-slate-700 stroke-current"
                      strokeWidth="8"
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                    ></circle>
                    <circle
                      className="text-brand-500 progress-ring__circle stroke-current transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeLinecap="round"
                      cx="50"
                      cy="50"
                      r="42"
                      fill="transparent"
                      strokeDasharray="263.89"
                      strokeDashoffset={263.89 - (263.89 * project.progress) / 100}
                      transform="rotate(-90 50 50)"
                    ></circle>
                  </svg>
                  <span className="absolute text-4xl font-bold text-slate-800 dark:text-white tracking-tighter">{project.progress}%</span>
                </div>
                
                <div className="flex flex-col items-center">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {project.activities.reduce((acc, curr) => acc + curr.subActivities.length, 0)} tarefas totais
                    </p>
                    <div className="flex gap-1 mt-2">
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                        <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                    </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Tabs de Navegação */}
        <div className="px-8 flex items-center gap-8 mt-2">
          <button 
            onClick={() => setActiveTab('list')}
            className={`pb-4 px-2 flex items-center gap-2 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'list' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <List size={18} /> Lista de Atividades
          </button>
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`pb-4 px-2 flex items-center gap-2 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'kanban' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Trello size={18} /> Quadro Kanban
          </button>
          <button 
            onClick={() => setActiveTab('recurrent')}
            className={`pb-4 px-2 flex items-center gap-2 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'recurrent' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
          >
            <Calendar size={18} /> Recorrência Mensal
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 overflow-auto custom-scrollbar">
        
        {/* TAB: LIST VIEW (MONDAY.COM STYLE) */}
        {activeTab === 'list' && (
          <div className="space-y-2 pb-20"> {/* COMPACTED SPACING */}
             {project.activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                   <List size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                   <p className="font-medium text-slate-500 dark:text-slate-400">Nenhuma atividade cadastrada.</p>
                   <p className="text-sm text-slate-400 dark:text-slate-500">Comece organizando seu projeto agora.</p>
                </div>
             ) : (
                project.activities.map(activity => {
                  const isExpanded = expandedActivities[activity.id] ?? true;
                  
                  return (
                    <div key={activity.id} className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"> {/* ROUNDED-MD */}
                       
                       {/* Activity Group Header */}
                       <div 
                         className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors border-l-4 border-l-brand-500"
                         onClick={() => toggleActivity(activity.id)}
                       >
                         <div className="flex items-center gap-3">
                            <div className={`p-1 rounded text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                               <ChevronRight size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-brand-600 dark:text-brand-400">
                               {activity.name}
                            </h3>
                            <span className="text-xs font-semibold text-slate-400 px-2">
                               {activity.subActivities.length} tarefas
                            </span>
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); handleOpenNewTask(activity.id, activity.name); }}
                            className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-bold px-3 py-1.5 rounded-lg transition-all"
                         >
                            <Plus size={14} /> Adicionar Tarefa
                         </button>
                       </div>

                       {/* Tasks Table */}
                       {isExpanded && (
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead className="text-xs font-bold text-slate-800 dark:text-white uppercase bg-slate-200 dark:bg-slate-900 border-y border-slate-300 dark:border-slate-600"> {/* IMPROVED HEADER VISIBILITY */}
                                <tr>
                                  <th className="px-4 py-3 font-bold w-[40%] pl-12 border-r border-slate-300 dark:border-slate-600">Tarefa</th>
                                  <th className="px-4 py-3 font-bold w-[15%] text-center border-r border-slate-300 dark:border-slate-600">Responsável</th>
                                  <th className="px-4 py-3 font-bold w-[15%] text-center border-r border-slate-300 dark:border-slate-600">Prazo</th>
                                  <th className="px-4 py-3 font-bold w-[15%] text-center border-r border-slate-300 dark:border-slate-600">Status</th>
                                  <th className="px-4 py-3 font-bold w-[15%] text-center">DMAIC</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                                {activity.subActivities.map(sub => (
                                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                     {/* Task Name */}
                                     <td className="px-4 py-2 pl-12 border-r border-slate-300 dark:border-slate-600 relative h-10"> {/* VISIBLE BORDER */}
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-full h-[1px] bg-slate-100 dark:bg-slate-700 -z-10"></div>
                                        <span className="text-slate-700 dark:text-slate-200 font-medium truncate block">{sub.name}</span>
                                     </td>

                                     {/* Responsible */}
                                     <td className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-600"> {/* VISIBLE BORDER */}
                                        <div className="flex justify-center">
                                           <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 text-xs font-bold flex items-center justify-center" title={sub.responsible}>
                                              {sub.responsible.charAt(0).toUpperCase()}
                                           </div>
                                        </div>
                                     </td>

                                     {/* Deadline */}
                                     <td className="px-2 py-1 text-center border-r border-slate-300 dark:border-slate-600"> {/* VISIBLE BORDER */}
                                        {sub.deadline ? (
                                           <span className="text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                              {new Date(sub.deadline).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short'})}
                                           </span>
                                        ) : (
                                           <span className="text-slate-300 dark:text-slate-600">-</span>
                                        )}
                                     </td>

                                     {/* Status (Badge Style with Border) */}
                                     <td className={`p-0 h-full border-r border-slate-300 dark:border-slate-600 relative group-hover:border-slate-50 transition-colors`}>
                                        <div className="w-full h-full flex items-center justify-center px-1">
                                          <select 
                                            value={sub.status}
                                            onChange={(e) => handleStatusChange(activity.id, sub.id, e.target.value as TaskStatus)}
                                            className={`w-full py-1 rounded text-center text-[10px] cursor-pointer appearance-none outline-none transition-colors ${STATUS_COLORS[sub.status]}`}
                                          >
                                            <option value="Não Iniciado" className="bg-white text-slate-800">Não Iniciado</option>
                                            <option value="Em Andamento" className="bg-white text-slate-800">Em Andamento</option>
                                            <option value="Concluído" className="bg-white text-slate-800">Concluído</option>
                                            <option value="Bloqueado" className="bg-white text-slate-800">Bloqueado</option>
                                          </select>
                                        </div>
                                     </td>

                                     {/* DMAIC (Badge Style with Border) */}
                                     <td className={`p-0 h-full relative px-1`}>
                                         <div className="w-full h-full flex items-center justify-center">
                                            <select 
                                              value={sub.dmaic}
                                              onChange={(e) => handleDmaicChange(activity.id, sub.id, e.target.value as DMAICPhase)}
                                              className={`w-full py-1 rounded text-center text-[10px] cursor-pointer appearance-none outline-none transition-colors ${DMAIC_COLORS[sub.dmaic]}`}
                                            >
                                              <option value="D - Definir" className="bg-white text-slate-800">Definir</option>
                                              <option value="M - Mensurar" className="bg-white text-slate-800">Mensurar</option>
                                              <option value="A - Analisar" className="bg-white text-slate-800">Analisar</option>
                                              <option value="I - Implementar" className="bg-white text-slate-800">Implementar</option>
                                              <option value="C - Controlar" className="bg-white text-slate-800">Controlar</option>
                                            </select>
                                        </div>
                                     </td>
                                  </tr>
                                ))}
                                {activity.subActivities.length === 0 && (
                                   <tr>
                                      <td colSpan={5} className="py-4 text-center text-xs text-slate-400 italic">
                                         Vazio
                                      </td>
                                   </tr>
                                )}
                              </tbody>
                            </table>
                         </div>
                       )}
                    </div>
                  )
                })
             )}
             
             {/* Add New Group Button - UPDATED STYLE (Header Bar Style) */}
             <div className="pt-2">
                <button 
                  onClick={handleOpenNewActivity}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-4 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 font-bold hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-all group"
                >
                   <div className="p-1 rounded bg-slate-100 dark:bg-slate-700 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 transition-colors">
                      <Plus size={20} />
                   </div>
                   <span>Adicionar Nova Demanda Principal</span>
                </button>
             </div>
          </div>
        )}

        {/* TAB: KANBAN VIEW */}
        {activeTab === 'kanban' && (
          <div className="flex gap-6 overflow-x-auto h-full pb-4">
            {(['Não Iniciado', 'Em Andamento', 'Bloqueado', 'Concluído'] as TaskStatus[]).map(status => {
              const tasksInColumn = project.activities.flatMap(a => a.subActivities).filter(s => s.status === status);
              
              return (
                <div key={status} className="flex-shrink-0 w-80 flex flex-col h-full rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className={`p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-sm flex justify-between items-center rounded-t-2xl
                    ${status === 'Concluído' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : ''}
                    ${status === 'Bloqueado' ? 'text-red-700 bg-red-50 border-red-200' : ''}
                    ${status === 'Em Andamento' ? 'text-blue-700 bg-blue-50 border-blue-200' : ''}
                    ${status === 'Não Iniciado' ? 'text-slate-700 bg-slate-200 dark:bg-slate-700 dark:text-slate-200' : ''}
                  `}>
                    {status}
                    <span className="bg-white/40 px-2 py-0.5 rounded-full text-xs shadow-sm min-w-[24px] text-center backdrop-blur-sm">
                      {tasksInColumn.length}
                    </span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {tasksInColumn.map(task => {
                      // Find parent activity name for context
                      const parentActivity = project.activities.find(a => a.subActivities.some(s => s.id === task.id))?.name;
                      
                      return (
                        <div key={task.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500 transition-all cursor-grab active:cursor-grabbing group">
                          <div className="text-xs text-slate-400 mb-2 flex justify-between items-center border-b border-slate-50 dark:border-slate-600 pb-2">
                            <span className="truncate max-w-[120px]" title={parentActivity}>{parentActivity}</span>
                            <span className={`font-bold text-[10px] px-2 py-0.5 rounded text-center border ${DMAIC_COLORS[task.dmaic]}`}>
                                {task.dmaic.split(' - ')[0]}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-white mb-4 leading-snug">{task.name}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-600 px-2 py-1 rounded-lg">
                              <div className="w-5 h-5 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 text-[10px] flex items-center justify-center font-bold">
                                {task.responsible.substring(0, 1)}
                              </div>
                              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[80px]">{task.responsible}</span>
                            </div>
                            {task.deadline && (
                               <span className="text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-600">
                                  {new Date(task.deadline).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                               </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {tasksInColumn.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs italic opacity-60">
                         <div className="w-12 h-1 bg-slate-200 dark:bg-slate-600 rounded-full mb-2"></div>
                         Vazio
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: RECURRENT (Matrix) */}
        {activeTab === 'recurrent' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
             <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
               <div className="flex items-center text-slate-800 dark:text-slate-200 font-bold">
                 <Clock className="mr-2 text-brand-600" size={20} />
                 Demandas Recorrentes | Controle Mensal
               </div>
               <div className="flex gap-4 text-xs font-medium bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm text-slate-600 dark:text-slate-300">
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div> Entregue (OK)</div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div> Pendente (X)</div>
                 <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-slate-300 rounded-full"></div> N/A (-)</div>
               </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-center border-collapse">
                 <thead>
                   <tr>
                     <th className="text-left p-4 min-w-[220px] border-b border-r border-slate-200 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tema / Atividade</th>
                     {MONTHS.map((month, i) => (
                       <th key={month} className="p-2 border-b border-r border-slate-200 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase min-w-[50px]">
                         {month}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {project.recurrentDemands.map((row) => (
                     <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                       <td className="text-left p-4 border-b border-r border-slate-200 dark:border-slate-600 font-semibold text-slate-700 dark:text-slate-300 text-sm">
                         {row.theme}
                       </td>
                       {row.data.map((cell, idx) => {
                         let cellClass = "bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"; // Default
                         if (cell.status === 'OK') cellClass = "bg-blue-600 text-white hover:bg-blue-700 shadow-sm";
                         if (cell.status === 'X') cellClass = "bg-red-500 text-white hover:bg-red-600 shadow-sm";
                         if (cell.status === 'PENDING') cellClass = "bg-white text-blue-800 font-extrabold border-2 border-blue-600 inset-0";

                         return (
                           <td 
                             key={`${row.id}-${idx}`} 
                             onClick={() => handleRecurrentToggle(row.id, idx)}
                             className="p-1.5 border-b border-r border-slate-200 dark:border-slate-600 cursor-pointer h-12"
                           >
                             <div className={`w-full h-full flex items-center justify-center rounded-md text-[10px] font-bold transition-all duration-200 ${cellClass}`}>
                               {cell.status === 'PENDING' ? 'HOJE' : (cell.status === '-' ? '•' : cell.status)}
                             </div>
                           </td>
                         );
                       })}
                     </tr>
                   ))}
                   {project.recurrentDemands.length === 0 && (
                     <tr>
                       <td colSpan={13} className="p-12 text-center text-slate-400 italic">
                         <Calendar className="mx-auto mb-2 opacity-50" size={32} />
                         Nenhuma demanda recorrente configurada para este projeto.
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}
      </div>

      {/* MODAL: ADICIONAR ATIVIDADE / TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {targetActivity ? 'Nova Tarefa' : 'Nova Demanda Principal'}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {targetActivity 
                    ? <span>Adicionando à: <strong className="text-brand-600">{targetActivity.name}</strong></span> 
                    : 'Crie um agrupamento de tarefas para organizar o projeto.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-8 space-y-6">
              
              {/* Se for NOVA ATIVIDADE (Demanda Principal) */}
              {!targetActivity && (
                <div>
                  <label htmlFor="activityName" className={labelClass}>Nome da Demanda (Agrupador) <span className="text-brand-500">*</span></label>
                  <input 
                    type="text" 
                    id="activityName"
                    name="activityName"
                    required={!targetActivity}
                    value={formData.activityName}
                    onChange={handleChange}
                    placeholder="Ex: Mapeamento de Processos"
                    className={inputClass}
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Este será o título do grupo de tarefas na lista.</p>
                </div>
              )}

              {/* SEÇÃO DA TAREFA / DESCRIÇÃO */}
              <div className={targetActivity ? "pt-4 border-t border-slate-100 dark:border-slate-700" : ""}>
                 
                 {/* Se for Adicionar Tarefa em existente, mostra título. Se for Nova Demanda, mostra sem borda, integrado */}
                 {targetActivity && (
                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                       Detalhes da Tarefa
                    </h3>
                 )}

                <div className="space-y-6">
                  {/* Nome da Tarefa (Full Width) */}
                  <div>
                    <label htmlFor="taskName" className={labelClass}>
                       {targetActivity ? "O que deve ser feito? (Tarefa)" : "Descrição da Demanda / O que deve ser feito?"} <span className="text-brand-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="taskName"
                      name="taskName"
                      required
                      value={formData.taskName}
                      onChange={handleChange}
                      placeholder={targetActivity ? "Ex: Realizar entrevistas..." : "Ex: Realizar entrevistas com operadores do turno A"}
                      className={inputClass}
                    />
                  </div>

                  {/* Grid 2 Colunas: Responsável & Prazo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="responsible" className={labelClass}>Responsável</label>
                      <input 
                        type="text" 
                        id="responsible"
                        name="responsible"
                        value={formData.responsible}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="deadline" className={labelClass}>Prazo (Data)</label>
                      <div className="relative">
                        <input 
                            type="date" 
                            id="deadline"
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className={`${inputClass} dark:[color-scheme:dark] cursor-pointer`}
                        />
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                      </div>
                    </div>
                  </div>

                  {/* Grid 2 Colunas: DMAIC & Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="dmaic" className={labelClass}>Fase do DMAIC</label>
                      <div className="relative">
                        <select 
                          id="dmaic"
                          name="dmaic"
                          value={formData.dmaic}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none cursor-pointer`}
                        >
                          <option value="D - Definir">D - Definir</option>
                          <option value="M - Mensurar">M - Mensurar</option>
                          <option value="A - Analisar">A - Analisar</option>
                          <option value="I - Implementar">I - Implementar</option>
                          <option value="C - Controlar">C - Controlar</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="status" className={labelClass}>Status Inicial</label>
                      <div className="relative">
                        <select 
                          id="status"
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none cursor-pointer`}
                        >
                          <option value="Não Iniciado">Não Iniciado</option>
                          <option value="Em Andamento">Em Andamento</option>
                          <option value="Bloqueado">Bloqueado</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-lg shadow-brand-200 dark:shadow-none flex items-center"
                >
                  <Save size={18} className="mr-2" />
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};