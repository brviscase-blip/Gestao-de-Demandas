import React, { useState } from 'react';
import { Project, SubActivity, TaskStatus, RecurrentMonthStatus, DMAICPhase } from '../types';
import { MONTHS, STATUS_COLORS, DMAIC_COLORS } from '../constants';
import { ArrowLeft, Plus, Calendar, List, Trello, Clock, Target, TrendingUp, AlertTriangle, X, Save, ChevronDown, ChevronRight } from 'lucide-react';

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

  const inputClass = "w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white">
        <button onClick={onBack} className="flex items-center text-sm text-slate-500 hover:text-brand-600 mb-6 transition-colors group">
          <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" />
          Voltar para Projetos
        </button>
        
        <div className="flex flex-col xl:flex-row gap-6 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${project.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {project.status}
              </span>
              <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
                {project.type || 'Projeto Geral'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">{project.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
               {project.justification && (
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1">
                     <AlertTriangle size={14} className="text-orange-500" /> Justificativa (Problema)
                   </div>
                   <p className="text-slate-600 leading-relaxed text-xs">{project.justification}</p>
                 </div>
               )}
               
               {project.objective && (
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1">
                     <Target size={14} className="text-blue-500" /> Objetivo (Solução)
                   </div>
                   <p className="text-slate-600 leading-relaxed text-xs">{project.objective}</p>
                 </div>
               )}

               {project.benefits && (
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                   <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1">
                     <TrendingUp size={14} className="text-green-500" /> Benefícios
                   </div>
                   <p className="text-slate-600 leading-relaxed text-xs">{project.benefits}</p>
                 </div>
               )}
               
               {!project.justification && !project.objective && (
                 <div className="col-span-3 text-slate-500 italic">
                   {project.description}
                 </div>
               )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-4 min-w-[200px]">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Progresso Geral</span>
                <span className="text-2xl font-bold text-brand-600">{project.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-brand-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${project.progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-8 mt-4">
          <button 
            onClick={() => setActiveTab('list')}
            className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'list' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <List size={18} /> Lista de Atividades
          </button>
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'kanban' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Trello size={18} /> Quadro Kanban
          </button>
          <button 
            onClick={() => setActiveTab('recurrent')}
            className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'recurrent' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Calendar size={18} /> Recorrência Mensal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-slate-50 p-8 overflow-auto custom-scrollbar">
        
        {/* TAB: LIST VIEW */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-[40%]">Atividade / Tarefa</th>
                    <th className="px-4 py-3 font-semibold w-[20%]">Responsável</th>
                    <th className="px-4 py-3 font-semibold text-center w-[15%]">Status</th>
                    <th className="px-4 py-3 font-semibold w-[25%]">Fase DMAIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.activities.map(activity => {
                    const isExpanded = expandedActivities[activity.id] ?? true; // Default open? User said "Expand/Collapse", usually default true for context.
                    return (
                      <React.Fragment key={activity.id}>
                        {/* Activity Header Row */}
                        <tr className="bg-slate-50/50 hover:bg-slate-100/50 transition-colors group border-b border-slate-100">
                          <td colSpan={4} className="px-2 py-2">
                            <div className="flex items-center justify-between">
                              <button 
                                onClick={() => toggleActivity(activity.id)}
                                className="flex items-center gap-2 text-slate-800 font-bold hover:text-brand-600 transition-colors text-sm px-2 py-1 rounded"
                              >
                                {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                {activity.name}
                                <span className="text-xs font-normal text-slate-400 ml-2 bg-slate-100 px-2 py-0.5 rounded-full">
                                  {activity.subActivities.length} tarefas
                                </span>
                              </button>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenNewTask(activity.id, activity.name); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center gap-1 text-brand-600 hover:text-white hover:bg-brand-600 font-medium px-3 py-1.5 rounded"
                              >
                                <Plus size={14} /> Nova Tarefa
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Sub-Activities Rows */}
                        {isExpanded && activity.subActivities.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50 transition-colors group/row">
                            <td className="px-4 py-2 pl-12 relative">
                              <div className="absolute left-[29px] top-0 bottom-0 w-px bg-slate-200" />
                              <div className="absolute left-[29px] top-1/2 w-3 h-px bg-slate-200" />
                              <span className="text-slate-600 text-sm">{sub.name}</span>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2 group-hover/row:bg-white rounded px-2 py-1 transition-colors">
                                <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600 shrink-0">
                                  {sub.responsible.substring(0, 1).toUpperCase()}
                                </div>
                                <input 
                                  type="text"
                                  value={sub.responsible}
                                  onChange={(e) => handleResponsibleChange(activity.id, sub.id, e.target.value)}
                                  className="bg-transparent border-b border-transparent focus:border-brand-500 hover:border-slate-300 outline-none text-sm text-slate-600 w-full"
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <select 
                                value={sub.status}
                                onChange={(e) => handleStatusChange(activity.id, sub.id, e.target.value as TaskStatus)}
                                className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer outline-none ring-1 ring-inset ring-transparent hover:ring-slate-200 focus:ring-brand-500 w-full text-center ${STATUS_COLORS[sub.status]}`}
                              >
                                <option value="Não Iniciado">Não Iniciado</option>
                                <option value="Em Andamento">Em Andamento</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Bloqueado">Bloqueado</option>
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <select 
                                value={sub.dmaic}
                                onChange={(e) => handleDmaicChange(activity.id, sub.id, e.target.value as DMAICPhase)}
                                className={`px-2 py-1 rounded text-xs font-semibold border-0 cursor-pointer outline-none ring-1 ring-inset ring-transparent hover:ring-slate-200 focus:ring-brand-500 w-full ${DMAIC_COLORS[sub.dmaic] || 'bg-gray-100 text-gray-800'}`}
                              >
                                <option value="D - Definir">D - Definir</option>
                                <option value="M - Mensurar">M - Mensurar</option>
                                <option value="A - Analisar">A - Analisar</option>
                                <option value="I - Implementar">I - Implementar</option>
                                <option value="C - Controlar">C - Controlar</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  {project.activities.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        Nenhuma atividade cadastrada. Comece adicionando uma nova demanda abaixo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
             <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button 
                onClick={handleOpenNewActivity}
                className="flex items-center text-sm font-medium text-brand-600 hover:text-brand-700 bg-white border border-brand-200 hover:bg-brand-50 px-4 py-2 rounded-lg transition-all shadow-sm"
              >
                <Plus size={16} className="mr-2" />
                Adicionar Nova Atividade (Demanda Principal)
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
                <div key={status} className="flex-shrink-0 w-80 flex flex-col h-full rounded-xl bg-slate-100/50 border border-slate-200">
                  <div className={`p-4 border-b border-slate-200 font-semibold text-sm flex justify-between items-center
                    ${status === 'Concluído' ? 'text-green-700 bg-green-50 rounded-t-xl' : ''}
                    ${status === 'Bloqueado' ? 'text-red-700 bg-red-50 rounded-t-xl' : ''}
                  `}>
                    {status}
                    <span className="bg-white/50 px-2 py-0.5 rounded text-xs border border-slate-200/50">
                      {tasksInColumn.length}
                    </span>
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {tasksInColumn.map(task => {
                      // Find parent activity name for context
                      const parentActivity = project.activities.find(a => a.subActivities.some(s => s.id === task.id))?.name;
                      
                      return (
                        <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                          <div className="text-xs text-slate-400 mb-1 flex justify-between">
                            <span>{parentActivity}</span>
                            <span className={`font-mono text-[10px] px-1 rounded ${DMAIC_COLORS[task.dmaic]}`}>{task.dmaic.split(' - ')[0]}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mb-3">{task.name}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] flex items-center justify-center font-bold">
                                {task.responsible.substring(0, 1)}
                              </div>
                              <span className="text-xs text-slate-500">{task.responsible}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {tasksInColumn.length === 0 && (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
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
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-200 bg-red-50 flex items-center justify-between">
               <div className="flex items-center text-red-800 font-bold">
                 <Clock className="mr-2" size={20} />
                 Demandas Recorrentes | Mensal
               </div>
               <div className="flex gap-4 text-xs">
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-700 rounded-sm"></div> OK</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Pendente (X)</div>
                 <div className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> N/A (-)</div>
               </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-center border-collapse">
                 <thead>
                   <tr>
                     <th className="text-left p-4 min-w-[200px] border-b border-r border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">Tema</th>
                     {MONTHS.map((month, i) => (
                       <th key={month} className="p-2 border-b border-r border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 min-w-[60px]">
                         {i + 1}.{month}
                       </th>
                     ))}
                   </tr>
                 </thead>
                 <tbody>
                   {project.recurrentDemands.map((row) => (
                     <tr key={row.id} className="hover:bg-slate-50">
                       <td className="text-left p-4 border-b border-r border-slate-200 font-medium text-slate-700 text-sm">
                         {row.theme}
                       </td>
                       {row.data.map((cell, idx) => {
                         let cellClass = "bg-white text-slate-400"; // Default -
                         if (cell.status === 'OK') cellClass = "bg-blue-700 text-white";
                         if (cell.status === 'X') cellClass = "bg-red-500 text-white";
                         if (cell.status === 'PENDING') cellClass = "bg-white text-slate-800 font-bold border-2 border-blue-700 inset-0";

                         return (
                           <td 
                             key={`${row.id}-${idx}`} 
                             onClick={() => handleRecurrentToggle(row.id, idx)}
                             className="p-1 border-b border-r border-slate-200 cursor-pointer h-12"
                           >
                             <div className={`w-full h-full flex items-center justify-center rounded text-xs font-bold transition-all ${cellClass}`}>
                               {cell.status === 'PENDING' ? 'OK' : cell.status}
                             </div>
                           </td>
                         );
                       })}
                     </tr>
                   ))}
                   {project.recurrentDemands.length === 0 && (
                     <tr>
                       <td colSpan={13} className="p-8 text-slate-400 italic">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {targetActivity ? 'Nova Sub-Atividade' : 'Nova Atividade Principal'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {targetActivity 
                    ? `Adicionando tarefa para: ${targetActivity.name}` 
                    : 'Crie um grupo de atividades e adicione a primeira tarefa.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSaveTask} className="p-6 space-y-5">
              
              {/* Se for NOVA ATIVIDADE, mostra o campo de Nome da Atividade */}
              {!targetActivity && (
                <div>
                  <label htmlFor="activityName" className={labelClass}>Nome da Atividade Principal</label>
                  <input 
                    type="text" 
                    id="activityName"
                    name="activityName"
                    required={!targetActivity}
                    value={formData.activityName}
                    onChange={handleChange}
                    placeholder="Ex: Mapeamento de Processos"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                  Detalhes da Tarefa / Sub-Atividade
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="taskName" className={labelClass}>Nome da Tarefa</label>
                    <input 
                      type="text" 
                      id="taskName"
                      name="taskName"
                      required
                      value={formData.taskName}
                      onChange={handleChange}
                      placeholder="Ex: Realizar entrevistas com operadores"
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      <label htmlFor="deadline" className={labelClass}>Prazo (Opcional)</label>
                      <input 
                        type="date" 
                        id="deadline"
                        name="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dmaic" className={labelClass}>Fase DMAIC</label>
                      <select 
                        id="dmaic"
                        name="dmaic"
                        value={formData.dmaic}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="D - Definir">D - Definir</option>
                        <option value="M - Mensurar">M - Mensurar</option>
                        <option value="A - Analisar">A - Analisar</option>
                        <option value="I - Implementar">I - Implementar</option>
                        <option value="C - Controlar">C - Controlar</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="status" className={labelClass}>Status Inicial</label>
                      <select 
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="Não Iniciado">Não Iniciado</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Bloqueado">Bloqueado</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-white bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors shadow-sm flex items-center"
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