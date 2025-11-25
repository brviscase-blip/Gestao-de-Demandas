import React, { useState } from 'react';
import { Project, SubActivity, TaskStatus, RecurrentMonthStatus, DMAICPhase } from '../types';
import { MONTHS, STATUS_COLORS, DMAIC_COLORS, N8N_WEBHOOK_URL } from '../constants';
import { ArrowLeft, Plus, Calendar, List, Trello, Clock, Target, TrendingUp, AlertTriangle, X, Save, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let updatedActivities;
      let payloadData = {};
      let newTask: SubActivity;

      // Define newTask first to use it in payload
      newTask = {
        id: crypto.randomUUID(),
        name: formData.taskName,
        responsible: formData.responsible,
        dmaic: formData.dmaic,
        status: formData.status,
        deadline: formData.deadline
      };

      if (targetActivity) {
          // Add task to existing activity
          updatedActivities = project.activities.map(act => {
              if (act.id === targetActivity.id) {
                  return {
                      ...act,
                      subActivities: [...act.subActivities, newTask]
                  };
              }
              return act;
          });
          
          // Prepare payload for N8N (Adding Task)
          payloadData = {
            event: 'create_task',
            projectId: project.id,
            projectTitle: project.title,
            activityId: targetActivity.id,
            activityName: targetActivity.name,
            task: newTask,
            timestamp: new Date().toISOString()
          };

      } else {
          // Create new activity + task
          const newActivityId = crypto.randomUUID();
          
          const newActivity = {
              id: newActivityId,
              name: formData.activityName,
              subActivities: [newTask]
          };
          
          updatedActivities = [...project.activities, newActivity];
          // Auto expand new activity
          setExpandedActivities(prev => ({ ...prev, [newActivityId]: true }));

          // Prepare payload for N8N (New Activity Group)
          payloadData = {
            event: 'create_activity',
            projectId: project.id,
            projectTitle: project.title,
            activity: newActivity,
            timestamp: new Date().toISOString()
          };
      }
      
      // Send to Webhook (Integration)
      if (N8N_WEBHOOK_URL) {
        // We don't await the fetch to fail the UI update, but we log errors
        fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payloadData),
        }).catch(err => console.error("Erro ao enviar webhook N8N:", err));
      }

      onUpdateProject({ ...project, activities: updatedActivities, progress: calculateProgress(updatedActivities) });
      setIsModalOpen(false);

    } catch (error) {
      console.error("Erro ao salvar atividade:", error);
      alert("Houve um erro ao tentar salvar. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
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
            className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'list' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <List size={18} />
            Lista
          </button>
          <button 
            onClick={() => setActiveTab('kanban')}
            className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'kanban' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Trello size={18} />
            Kanban
          </button>
          <button 
            onClick={() => setActiveTab('recurrent')}
            className={`pb-3 px-1 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'recurrent' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            <Calendar size={18} />
            Recorrências
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
        
        {/* VIEW: LISTA */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            {project.activities.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <List size={48} className="mx-auto mb-4 opacity-20" />
                <p>Nenhuma atividade cadastrada.</p>
                <button onClick={handleOpenNewActivity} className="text-brand-600 font-medium mt-2 hover:underline">
                  Criar primeira atividade
                </button>
              </div>
            )}

            {project.activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div 
                  className="bg-slate-50 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => toggleActivity(activity.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-200 ${expandedActivities[activity.id] ? 'rotate-90' : ''}`}>
                      <ChevronRight size={20} className="text-slate-400" />
                    </div>
                    <h3 className="font-bold text-slate-800">{activity.name}</h3>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                      {activity.subActivities.length}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenNewTask(activity.id, activity.name);
                    }}
                    className="p-1.5 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors text-xs font-medium flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar Tarefa
                  </button>
                </div>
                
                {expandedActivities[activity.id] && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3 font-semibold">Tarefa</th>
                          <th className="px-6 py-3 font-semibold">Responsável</th>
                          <th className="px-6 py-3 font-semibold">Fase DMAIC</th>
                          <th className="px-6 py-3 font-semibold">Prazo</th>
                          <th className="px-6 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {activity.subActivities.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-3 font-medium text-slate-800">{sub.name}</td>
                            <td className="px-6 py-3">
                              <input 
                                type="text"
                                value={sub.responsible}
                                onChange={(e) => handleResponsibleChange(activity.id, sub.id, e.target.value)}
                                className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none w-24 transition-colors"
                              />
                            </td>
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${DMAIC_COLORS[sub.dmaic]}`}>
                                {sub.dmaic.split(' - ')[0]}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-slate-500 font-mono text-xs">
                              {sub.deadline ? new Date(sub.deadline).toLocaleDateString('pt-BR') : '-'}
                            </td>
                            <td className="px-6 py-3">
                              <select 
                                value={sub.status}
                                onChange={(e) => handleStatusChange(activity.id, sub.id, e.target.value as TaskStatus)}
                                className={`text-xs font-bold px-2 py-1 rounded-md border appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-200 ${STATUS_COLORS[sub.status]}`}
                              >
                                {Object.keys(STATUS_COLORS).map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                        {activity.subActivities.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-slate-400 italic text-xs">
                              Nenhuma tarefa nesta atividade.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VIEW: KANBAN */}
        {activeTab === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full min-h-[500px]">
            {['Não Iniciado', 'Em Andamento', 'Bloqueado', 'Concluído'].map((status) => (
              <div key={status} className="bg-slate-100/50 rounded-xl p-4 flex flex-col h-full border border-slate-200">
                <div className={`font-bold mb-4 flex items-center justify-between pb-3 border-b border-slate-200 ${status === 'Concluído' ? 'text-green-700' : status === 'Bloqueado' ? 'text-red-700' : 'text-slate-700'}`}>
                  <span>{status}</span>
                  <span className="text-xs bg-white px-2 py-1 rounded-full text-slate-500 shadow-sm">
                    {project.activities.flatMap(a => a.subActivities).filter(s => s.status === status).length}
                  </span>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                  {project.activities.flatMap(a => a.subActivities.map(s => ({...s, activityName: a.name, activityId: a.id})))
                    .filter(s => s.status === status)
                    .map(task => (
                      <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group">
                        <div className="text-xs text-slate-400 mb-1 flex justify-between">
                          <span>{task.activityName}</span>
                          <span className={`w-2 h-2 rounded-full ${DMAIC_COLORS[task.dmaic].includes('purple') ? 'bg-purple-500' : DMAIC_COLORS[task.dmaic].includes('indigo') ? 'bg-indigo-500' : DMAIC_COLORS[task.dmaic].includes('cyan') ? 'bg-cyan-500' : DMAIC_COLORS[task.dmaic].includes('orange') ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                        </div>
                        <p className="text-sm font-medium text-slate-800 mb-2">{task.name}</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {task.responsible.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-500 truncate max-w-[60px]">{task.responsible}</span>
                          </div>
                          {task.deadline && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {new Date(task.deadline).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit'})}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* VIEW: RECORRÊNCIAS */}
        {activeTab === 'recurrent' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Controle de Recorrências</h3>
              <p className="text-slate-500 text-sm">Acompanhamento mensal das rotinas do projeto.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-1/4">Tema / Demanda</th>
                    {MONTHS.map(m => (
                      <th key={m} className="px-2 py-4 font-semibold text-center w-[6%]">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {project.recurrentDemands.length > 0 ? (
                    project.recurrentDemands.map((demand) => (
                      <tr key={demand.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800 border-r border-slate-100">
                          {demand.theme}
                        </td>
                        {demand.data.map((monthStatus, idx) => (
                          <td key={idx} className="px-2 py-4 text-center border-r border-slate-100 last:border-0">
                            <button
                              onClick={() => handleRecurrentToggle(demand.id, idx)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all ${
                                monthStatus.status === 'OK' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                monthStatus.status === 'X' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                monthStatus.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                'bg-slate-100 text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {monthStatus.status === 'OK' && 'OK'}
                              {monthStatus.status === 'X' && <X size={16} />}
                              {monthStatus.status === 'PENDING' && '!'}
                              {monthStatus.status === '-' && '-'}
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={13} className="px-6 py-12 text-center text-slate-400">
                        <Calendar size={32} className="mx-auto mb-3 opacity-20" />
                        Nenhuma demanda recorrente configurada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab === 'list' && (
        <button
          onClick={handleOpenNewActivity}
          className="absolute bottom-8 right-8 bg-brand-600 text-white p-4 rounded-full shadow-xl shadow-brand-200 hover:bg-brand-700 transition-all hover:scale-110 z-10 flex items-center justify-center"
          title="Nova Atividade Principal"
        >
          <Plus size={24} />
        </button>
      )}

      {/* MODAL: NOVA ATIVIDADE / TAREFA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {targetActivity ? 'Nova Tarefa' : 'Nova Atividade Principal'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {targetActivity 
                    ? `Adicionando à: ${targetActivity.name}` 
                    : 'Crie um grupo de atividades e adicione a primeira tarefa.'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-6 space-y-5">
              
              {/* Nome da Atividade (Só aparece se for nova atividade principal) */}
              {!targetActivity && (
                <div>
                  <label htmlFor="activityName" className={labelClass}>Nome da Atividade Principal</label>
                  <input 
                    type="text" 
                    name="activityName"
                    id="activityName"
                    value={formData.activityName}
                    onChange={handleChange}
                    placeholder="Ex: Mapeamento de Processos"
                    className={inputClass}
                    required={!targetActivity}
                  />
                </div>
              )}

              {/* Separator / Subtitle */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                  Detalhes da Tarefa / Sub-Atividade
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="taskName" className={labelClass}>Nome da Tarefa</label>
                    <input 
                      type="text" 
                      name="taskName"
                      id="taskName"
                      value={formData.taskName}
                      onChange={handleChange}
                      placeholder="Ex: Realizar entrevistas com operadores"
                      className={inputClass}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="responsible" className={labelClass}>Responsável</label>
                      <input 
                        type="text" 
                        name="responsible"
                        id="responsible"
                        value={formData.responsible}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="deadline" className={labelClass}>Prazo (Opcional)</label>
                      <input 
                        type="date" 
                        name="deadline"
                        id="deadline"
                        value={formData.deadline}
                        onChange={handleChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dmaic" className={labelClass}>Fase DMAIC</label>
                      <div className="relative">
                        <select 
                          name="dmaic" 
                          id="dmaic"
                          value={formData.dmaic}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none`}
                        >
                          {Object.keys(DMAIC_COLORS).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="status" className={labelClass}>Status Inicial</label>
                      <div className="relative">
                        <select 
                          name="status" 
                          id="status"
                          value={formData.status}
                          onChange={handleChange}
                          className={`${inputClass} appearance-none`}
                        >
                          {Object.keys(STATUS_COLORS).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 text-white bg-brand-600 hover:bg-brand-700 rounded-lg font-medium transition-colors shadow-lg shadow-brand-100 flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Salvar
                    </>
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
