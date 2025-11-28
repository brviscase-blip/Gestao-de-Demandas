import React, { useState } from 'react';
import { Project, SubActivity, TaskStatus, RecurrentMonthStatus, DMAICPhase } from '../types';
import { MONTHS, STATUS_COLORS, DMAIC_COLORS } from '../constants';
import { ArrowLeft, Plus, Calendar, List, Trello, Clock, Target, TrendingUp, AlertTriangle, X, Save, ChevronDown, ChevronRight, User, CalendarDays, Tag, Activity, Pencil, Settings, ChevronUp, Trash2 } from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
  onLocalUpdateProject: (updatedProject: Project) => void;
  onCreateDemand?: (data: any) => Promise<void>;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject, onLocalUpdateProject, onCreateDemand }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'kanban' | 'recurrent'>('list');
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({});
  
  // Header State - Initialized to false to hide details by default
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  // targetActivity serve para saber o PAI (Activity) da tarefa sendo criada/editada
  const [targetActivity, setTargetActivity] = useState<{id: string, name: string} | null>(null);
  // editingTask serve para saber se estamos EDITANDO uma tarefa específica
  const [editingTask, setEditingTask] = useState<{id: string} | null>(null);
  // isEditingActivity serve para saber se estamos EDITANDO O GRUPO (Demanda Principal)
  const [isEditingActivity, setIsEditingActivity] = useState(false);

  // Delete Confirmation State (Task)
  const [taskToDelete, setTaskToDelete] = useState<{activityId: string, taskId: string, activityName: string, taskName: string} | null>(null);
  // Delete Confirmation State (Activity/Group)
  const [activityToDelete, setActivityToDelete] = useState<{id: string, name: string} | null>(null);
  
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

  const calculateProgress = (activities: any[]) => {
    const allSubs = activities.flatMap(a => a.subActivities);
    const completed = allSubs.filter((s: any) => s.status === 'Concluído').length;
    return allSubs.length > 0 ? Math.round((completed / allSubs.length) * 100) : 0;
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

  // ==========================================================
  // MODAL HANDLERS (Create & Edit)
  // ==========================================================

  // 1. Abrir Modal para NOVA DEMANDA PRINCIPAL (Grupo)
  const handleOpenNewActivity = () => {
    setTargetActivity(null);
    setEditingTask(null);
    setIsEditingActivity(false);
    setFormData({ activityName: '', taskName: '', responsible: 'Rafael', dmaic: 'M - Mensurar', status: 'Não Iniciado', deadline: '' });
    setIsModalOpen(true);
  };

  // 1.5 Abrir Modal para EDITAR DEMANDA PRINCIPAL (Grupo)
  const handleOpenEditActivity = (e: React.MouseEvent, activityId: string, activityName: string) => {
    e.stopPropagation();
    setTargetActivity({ id: activityId, name: activityName });
    setEditingTask(null);
    setIsEditingActivity(true);
    setFormData({
        activityName: activityName,
        taskName: '',
        responsible: '',
        dmaic: 'M - Mensurar',
        status: 'Não Iniciado',
        deadline: ''
    });
    setIsModalOpen(true);
  };

  // 2. Abrir Modal para NOVA TAREFA dentro de um grupo
  const handleOpenNewTask = (activityId: string, activityName: string) => {
    setExpandedActivities(prev => ({ ...prev, [activityId]: true }));
    setTargetActivity({ id: activityId, name: activityName });
    setEditingTask(null);
    setIsEditingActivity(false);
    setFormData({ activityName: activityName, taskName: '', responsible: 'Rafael', dmaic: 'I - Implementar', status: 'Não Iniciado', deadline: '' });
    setIsModalOpen(true);
  };

  // 3. Abrir Modal para EDITAR UMA TAREFA existente
  const handleOpenEditTask = (activityId: string, activityName: string, task: SubActivity) => {
    setTargetActivity({ id: activityId, name: activityName });
    setEditingTask({ id: task.id });
    setIsEditingActivity(false);
    setFormData({
        activityName: activityName,
        taskName: task.name,
        responsible: task.responsible,
        dmaic: task.dmaic,
        status: task.status,
        deadline: task.deadline ? task.deadline.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  // 4. Salvar (Create ou Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CENÁRIO 0: EDIÇÃO DE GRUPO (DEMANDA PRINCIPAL)
    if (isEditingActivity && targetActivity) {
        const updatedActivities = project.activities.map(act => {
            if (act.id !== targetActivity.id) return act;
            return { ...act, name: formData.activityName };
        });

        // 1. Optimistic Update
        onLocalUpdateProject({ ...project, activities: updatedActivities });
        setIsModalOpen(false);

        // 2. Webhook
        if (onCreateDemand) {
             const payload = {
                type: 'update_demand_group',
                projectId: project.id,
                projectTitle: project.title,
                activityGroupId: targetActivity.id,
                activityGroupName: formData.activityName
            };
            onCreateDemand(payload).catch(err => console.error("Erro ao atualizar grupo:", err));
        }
    }
    // CENÁRIO A: EDIÇÃO DE TAREFA EXISTENTE
    else if (editingTask && targetActivity) {
        const updatedActivities = project.activities.map(act => {
            if (act.id !== targetActivity.id) return act;
            return {
                ...act,
                subActivities: act.subActivities.map(sub => {
                    if (sub.id !== editingTask.id) return sub;
                    return {
                        ...sub,
                        name: formData.taskName,
                        responsible: formData.responsible,
                        dmaic: formData.dmaic,
                        status: formData.status,
                        deadline: formData.deadline
                    };
                })
            };
        });

        // 1. Atualização Visual Imediata (Optimistic UI)
        onLocalUpdateProject({ 
            ...project, 
            activities: updatedActivities, 
            progress: calculateProgress(updatedActivities) 
        });

        // 2. Fechar Modal Imediatamente
        setIsModalOpen(false);

        // 3. Envio para o Backend (N8N) - Fire and Forget
        if (onCreateDemand) {
            const payload = {
                type: 'update_task', // Tipo específico para atualização
                projectId: project.id,
                projectTitle: project.title,
                activityGroupId: targetActivity.id,
                activityGroupName: targetActivity.name,
                taskId: editingTask.id,
                taskName: formData.taskName,
                responsible: formData.responsible,
                status: formData.status,
                dmaic: formData.dmaic,
                deadline: formData.deadline
            };
            // Não usamos await aqui para não bloquear a UI caso o webhook demore
            onCreateDemand(payload).catch(err => console.error("Erro ao atualizar tarefa no background:", err));
        }
    } 
    // CENÁRIO B: CRIAÇÃO (Nova Tarefa ou Novo Grupo)
    else {
        const newActivityId = targetActivity ? targetActivity.id : crypto.randomUUID();
        const newTaskId = crypto.randomUUID();

        // 1. Preparar Payload
        let webhookPayload = null;
        if (onCreateDemand) {
            webhookPayload = {
                projectId: project.id,
                projectTitle: project.title,
                activityGroupId: newActivityId,
                activityGroupName: targetActivity ? targetActivity.name : formData.activityName,
                taskId: newTaskId,
                taskName: formData.taskName, 
                responsible: formData.responsible,
                dmaic: formData.dmaic,
                status: formData.status,
                deadline: formData.deadline,
                type: targetActivity ? 'new_task' : 'new_demand_group'
            };
        }

        // 2. Atualização Local (Optimistic UI)
        let updatedActivities;
        if (targetActivity) {
            // Adicionar tarefa em grupo existente
            updatedActivities = project.activities.map(act => {
                if (act.id === targetActivity.id) {
                    return {
                        ...act,
                        subActivities: [...act.subActivities, {
                            id: newTaskId,
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
            // Criar novo grupo + tarefa
            const newActivity = {
                id: newActivityId,
                name: formData.activityName,
                subActivities: [{
                    id: newTaskId,
                    name: formData.taskName,
                    responsible: formData.responsible,
                    dmaic: formData.dmaic,
                    status: formData.status,
                    deadline: formData.deadline
                }]
            };
            updatedActivities = [...project.activities, newActivity];
            setExpandedActivities(prev => ({ ...prev, [newActivityId]: true }));
        }
        
        onLocalUpdateProject({ ...project, activities: updatedActivities, progress: calculateProgress(updatedActivities) });
        
        // 3. Fechar Modal Imediatamente
        setIsModalOpen(false);

        // 4. Envio para o Backend (N8N) - Fire and Forget
        if (onCreateDemand && webhookPayload) {
             // Não usamos await aqui para não bloquear a UI caso o webhook demore
             onCreateDemand(webhookPayload).catch(err => console.error("Erro ao criar demanda no background:", err));
        }
    }
  };

  // ==========================================================
  // DELETE HANDLERS
  // ==========================================================

  const handleClickDeleteTask = (e: React.MouseEvent, activityId: string, taskId: string, activityName: string, taskName: string) => {
    e.stopPropagation();
    setTaskToDelete({ activityId, taskId, activityName, taskName });
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    const { activityId, taskId, activityName, taskName } = taskToDelete;

    // 1. Atualização Local (Optimistic UI)
    const updatedActivities = project.activities.map(act => {
        if (act.id !== activityId) return act;
        return {
            ...act,
            subActivities: act.subActivities.filter(t => t.id !== taskId)
        };
    });

    onLocalUpdateProject({ 
        ...project, 
        activities: updatedActivities,
        progress: calculateProgress(updatedActivities)
    });

    setTaskToDelete(null);

    // 2. Envio para o Webhook (N8N)
    if (onCreateDemand) {
        setTimeout(() => {
            const payload = {
                type: 'delete_task', 
                projectId: project.id,
                projectTitle: project.title,
                activityGroupId: activityId,
                activityGroupName: activityName,
                taskId: taskId,
                taskName: taskName
            };
            onCreateDemand(payload).catch(err => console.error("Erro ao excluir tarefa:", err));
        }, 0);
    }
  };

  const handleClickDeleteActivity = (e: React.MouseEvent, activityId: string, activityName: string) => {
    e.stopPropagation();
    setActivityToDelete({ id: activityId, name: activityName });
  };

  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    const { id: activityId, name: activityName } = activityToDelete;

    // 1. Atualização Local
    const updatedActivities = project.activities.filter(a => a.id !== activityId);
    
    onLocalUpdateProject({ 
        ...project, 
        activities: updatedActivities,
        progress: calculateProgress(updatedActivities)
    });

    setActivityToDelete(null);

    // 2. Webhook
    if (onCreateDemand) {
        setTimeout(() => {
            const payload = {
                type: 'delete_demand_group',
                projectId: project.id,
                projectTitle: project.title,
                activityGroupId: activityId,
                activityGroupName: activityName
            };
            onCreateDemand(payload).catch(err => console.error("Erro ao excluir grupo:", err));
        }, 0);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all shadow-sm font-medium";
  const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide";

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10 transition-colors">
        <div className="px-8 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
            <button onClick={onBack} className="flex items-center text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-brand-600 transition-colors group">
              <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
              Voltar para Projetos
            </button>
        </div>

        <div className="px-8 py-6">
          <div className="flex flex-col gap-6">
            {/* Top Row: Essential Info (Always Visible) */}
            <div className="grid grid-cols-12 gap-4 items-stretch">
                <div className="col-span-12 lg:col-span-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden group">
                   <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Projeto</span>
                   <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate" title={project.title}>
                    {project.title}
                   </h1>
                </div>

                <div className="col-span-6 md:col-span-3 lg:col-span-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Responsável</span>
                   </div>
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate" title={project.responsibleLead}>
                      {project.responsibleLead}
                   </div>
                </div>

                <div className="col-span-6 md:col-span-3 lg:col-span-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1">
                      <CalendarDays size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Início</span>
                   </div>
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                      {new Date(project.startDate).toLocaleDateString('pt-BR')}
                   </div>
                </div>

                <div className={`col-span-6 md:col-span-3 lg:col-span-2 border rounded-xl p-3 flex flex-col justify-center ${project.status === 'Ativo' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
                   <div className="flex items-center gap-2 mb-1">
                      <Activity size={14} className={project.status === 'Ativo' ? 'text-green-500' : 'text-yellow-500'} />
                      <span className={`text-[10px] font-bold uppercase ${project.status === 'Ativo' ? 'text-green-600/70 dark:text-green-400/70' : 'text-yellow-600/70 dark:text-yellow-400/70'}`}>Status</span>
                   </div>
                   <div className={`font-bold text-sm ${project.status === 'Ativo' ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                      {project.status}
                   </div>
                </div>

                <div className="col-span-6 md:col-span-3 lg:col-span-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-1">
                      <Tag size={14} className="text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Tipo</span>
                   </div>
                   <div className="font-bold text-slate-700 dark:text-slate-200 text-xs truncate" title={project.type}>
                      {project.type || 'Geral'}
                   </div>
                </div>
            </div>

            {/* Collapsible Details Section */}
            {isHeaderExpanded && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fade-in">
                <div className="lg:col-span-9 flex flex-col h-full">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-orange-200 hover:bg-orange-50/30 dark:hover:bg-orange-900/20 transition-colors flex flex-col min-h-[180px]">
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase mb-3 pb-2 border-b border-orange-100/50 dark:border-orange-900/50">
                          <AlertTriangle size={14} /> Justificativa (Problema)
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                          {project.justification || <span className="text-slate-400 italic">Não informado</span>}
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-blue-200 hover:bg-blue-50/30 dark:hover:bg-blue-900/20 transition-colors flex flex-col min-h-[180px]">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase mb-3 pb-2 border-b border-blue-100/50 dark:border-blue-900/50">
                          <Target size={14} /> Objetivo (Solução)
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                          {project.objective || project.description || <span className="text-slate-400 italic">Não informado</span>}
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-700/50 p-5 rounded-xl border border-slate-100 dark:border-slate-600 hover:border-green-200 hover:bg-green-50/30 dark:hover:bg-green-900/20 transition-colors flex flex-col min-h-[180px]">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-xs uppercase mb-3 pb-2 border-b border-green-100/50 dark:border-green-900/50">
                          <TrendingUp size={14} /> Benefícios Esperados
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed flex-1">
                          {project.benefits || <span className="text-slate-400 italic">Não informado</span>}
                        </p>
                      </div>
                   </div>
                </div>

                <div className="lg:col-span-3 h-full">
                  <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-600 shadow-sm p-6 h-full flex flex-col justify-center items-center relative overflow-hidden min-h-[220px]">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-500"></div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Progresso Geral</h3>
                    <div className="relative w-32 h-32 flex items-center justify-center mb-4">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-slate-100 dark:text-slate-700 stroke-current" strokeWidth="8" cx="50" cy="50" r="42" fill="transparent"></circle>
                        <circle className="text-brand-500 progress-ring__circle stroke-current transition-all duration-1000 ease-out" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="42" fill="transparent" strokeDasharray="263.89" strokeDashoffset={263.89 - (263.89 * project.progress) / 100} transform="rotate(-90 50 50)"></circle>
                      </svg>
                      <span className="absolute text-3xl font-bold text-slate-800 dark:text-white tracking-tighter">{project.progress}%</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {project.activities.reduce((acc, curr) => acc + curr.subActivities.length, 0)} tarefas totais
                        </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Toggle Button */}
            <div className="flex justify-center -mt-2">
               <button 
                  onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                  className="flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-brand-600 transition-all hover:bg-slate-100 dark:hover:bg-slate-700/50 px-3 py-1.5 rounded-full"
               >
                  {isHeaderExpanded ? (
                    <>
                      <ChevronUp size={14} /> Recolher Detalhes
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Ver Detalhes Completos
                    </>
                  )}
               </button>
            </div>
          </div>
        </div>

        <div className="px-8 flex items-center gap-8 mt-1">
          <button onClick={() => setActiveTab('list')} className={`pb-4 px-2 flex items-center gap-2 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'list' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            <List size={18} /> Lista de Atividades
          </button>
          <button onClick={() => setActiveTab('kanban')} className={`pb-4 px-2 flex items-center gap-2 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'kanban' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            <Trello size={18} /> Quadro Kanban
          </button>
          <button onClick={() => setActiveTab('recurrent')} className={`pb-4 px-2 flex items-center gap-2 text-sm font-bold border-b-[3px] transition-colors ${activeTab === 'recurrent' ? 'border-brand-600 text-brand-600 dark:text-brand-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}>
            <Calendar size={18} /> Recorrência Mensal
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-auto custom-scrollbar">
        
        {activeTab === 'list' && (
          <div className="space-y-2 pb-20">
             {project.activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800">
                   <List size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                   <p className="font-medium text-slate-500 dark:text-slate-400">Nenhuma atividade cadastrada.</p>
                   <p className="text-sm text-slate-400 dark:text-slate-500">Comece organizando seu projeto agora.</p>
                </div>
             ) : (
                project.activities.map(activity => {
                  // MUDANÇA AQUI: Iniciar com ?? false faz com que o grupo comece recolhido por padrão
                  const isExpanded = expandedActivities[activity.id] ?? false;
                  
                  return (
                    <div key={activity.id} className="bg-white dark:bg-slate-800 rounded-md shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                       
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

                         {/* ACTION BUTTONS (ADD, EDIT GROUP, DELETE GROUP) */}
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={(e) => handleOpenEditActivity(e, activity.id, activity.name)}
                                className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                                title="Editar Nome da Demanda"
                            >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={(e) => handleClickDeleteActivity(e, activity.id, activity.name)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-all"
                                title="Excluir Demanda"
                            >
                                <Trash2 size={14} />
                            </button>
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenNewTask(activity.id, activity.name); }}
                                className="text-xs flex items-center gap-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 font-bold px-3 py-1.5 rounded-lg transition-all"
                            >
                                <Plus size={14} /> Adicionar Tarefa
                            </button>
                         </div>
                       </div>

                       {isExpanded && (
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                              <thead className="text-xs font-bold text-slate-800 dark:text-white uppercase bg-slate-200 dark:bg-slate-900 border-y border-slate-300 dark:border-slate-600">
                                <tr>
                                  <th className="px-4 py-3 font-bold w-[40%] pl-12 border-r border-slate-300 dark:border-slate-600">Tarefa</th>
                                  <th className="px-4 py-3 font-bold w-[15%] text-center border-r border-slate-300 dark:border-slate-600">Responsável</th>
                                  <th className="px-4 py-3 font-bold w-[10%] text-center border-r border-slate-300 dark:border-slate-600">Prazo</th>
                                  <th className="px-4 py-3 font-bold w-[12%] text-center border-r border-slate-300 dark:border-slate-600">Status</th>
                                  <th className="px-4 py-3 font-bold w-[13%] text-center border-r border-slate-300 dark:border-slate-600">DMAIC</th>
                                  <th className="px-4 py-3 font-bold w-[10%] text-center text-slate-400"><Settings size={16} className="mx-auto" /></th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                                {activity.subActivities.map(sub => (
                                  <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                     {/* Task Name - Increased Font Size to 15px as requested */}
                                     <td className="px-4 py-3 pl-12 border-r border-slate-300 dark:border-slate-600">
                                        <span className="text-[15px] font-medium text-slate-900 dark:text-slate-100 block truncate" title={sub.name}>
                                            {sub.name}
                                        </span>
                                     </td>

                                     {/* Responsible - Read Only */}
                                     <td className="px-4 py-3 text-center border-r border-slate-300 dark:border-slate-600">
                                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            {sub.responsible}
                                        </span>
                                     </td>

                                     {/* Deadline - Badge */}
                                     <td className="px-4 py-3 text-center border-r border-slate-300 dark:border-slate-600">
                                        {sub.deadline ? (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                                <Calendar size={12} />
                                                {new Date(sub.deadline).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                     </td>

                                     {/* Status - Improved Badge Style (Centered, Compact, Rounded) */}
                                     <td className="px-4 py-3 text-center border-r border-slate-300 dark:border-slate-600">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${STATUS_COLORS[sub.status]}`}>
                                            {sub.status}
                                        </span>
                                     </td>

                                     {/* DMAIC - Full Name */}
                                     <td className="px-4 py-3 text-center border-r border-slate-300 dark:border-slate-600">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${DMAIC_COLORS[sub.dmaic]}`}>
                                            {sub.dmaic}
                                        </span>
                                     </td>

                                     {/* Action: Edit & Delete Buttons */}
                                     <td className="px-4 py-3 text-center">
                                         <div className="flex items-center justify-center gap-1">
                                            <button 
                                                onClick={(e) => handleClickDeleteTask(e, activity.id, sub.id, activity.name, sub.name)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all"
                                                title="Excluir Tarefa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleOpenEditTask(activity.id, activity.name, sub)}
                                                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg transition-all"
                                                title="Editar Tarefa"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                         </div>
                                     </td>
                                  </tr>
                                ))}
                                {activity.subActivities.length === 0 && (
                                   <tr>
                                      <td colSpan={6} className="py-4 text-center text-xs text-slate-400 italic">
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
             
             <div className="pt-2">
                <button 
                  onClick={handleOpenNewActivity}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 font-bold hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                >
                   <Plus size={20} className="group-hover:scale-110 transition-transform" />
                   <span>Adicionar Nova Demanda Principal</span>
                </button>
             </div>
          </div>
        )}

        {activeTab === 'kanban' && (
          <div className="flex gap-6 overflow-x-auto h-full pb-4">
            {(['Não Iniciado', 'Em Andamento', 'Bloqueado', 'Concluído'] as TaskStatus[]).map(status => {
              const tasksInColumn = project.activities.flatMap(a => a.subActivities).filter(s => s.status === status);
              return (
                <div key={status} className="flex-shrink-0 w-80 flex flex-col h-full rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className={`p-4 border-b border-slate-200 dark:border-slate-700 font-bold text-sm flex justify-between items-center rounded-t-2xl
                    ${status === 'Concluído' ? 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-slate-700 dark:text-emerald-300 dark:border-emerald-600' : ''}
                    ${status === 'Bloqueado' ? 'text-red-700 bg-red-50 border-red-200 dark:bg-slate-700 dark:text-red-300 dark:border-red-600' : ''}
                    ${status === 'Em Andamento' ? 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-slate-700 dark:text-blue-300 dark:border-blue-600' : ''}
                    ${status === 'Não Iniciado' ? 'text-slate-700 bg-slate-200 dark:bg-slate-700 dark:text-slate-200' : ''}
                  `}>
                    {status}
                    <span className="bg-white/40 px-2 py-0.5 rounded-full text-xs shadow-sm min-w-[24px] text-center backdrop-blur-sm">
                      {tasksInColumn.length}
                    </span>
                  </div>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    {tasksInColumn.map(task => {
                      const parentActivity = project.activities.find(a => a.subActivities.some(s => s.id === task.id));
                      return (
                        <div key={task.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 hover:shadow-md hover:border-brand-300 dark:hover:border-brand-500 transition-all cursor-grab active:cursor-grabbing group relative">
                          {/* Botões de Ação no Kanban (Edit + Delete) */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (parentActivity) handleClickDeleteTask(e, parentActivity.id, task.id, parentActivity.name, task.name);
                                }}
                                className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors"
                                title="Excluir"
                            >
                                <Trash2 size={12} />
                            </button>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (parentActivity) handleOpenEditTask(parentActivity.id, parentActivity.name, task);
                                }}
                                className="p-1.5 text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-full transition-colors"
                                title="Editar"
                            >
                                <Pencil size={12} />
                            </button>
                          </div>

                          <div className="text-xs text-slate-400 mb-2 flex justify-between items-center border-b border-slate-50 dark:border-slate-600 pb-2">
                            <span className="truncate max-w-[120px]" title={parentActivity?.name}>{parentActivity?.name}</span>
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
                         let cellClass = "bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"; 
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  {isEditingActivity 
                    ? 'Editar Demanda Principal'
                    : (editingTask ? 'Editar Tarefa' : (targetActivity ? 'Nova Tarefa' : 'Nova Demanda Principal'))
                  }
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {isEditingActivity
                    ? 'Alterar o nome do grupo de atividades.'
                    : (targetActivity 
                        ? <span>{editingTask ? 'Editando em' : 'Adicionando à'}: <strong className="text-brand-600">{targetActivity.name}</strong></span> 
                        : 'Crie um agrupamento de tarefas para organizar o projeto.')
                  }
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
              
              {/* Campo Nome da Demanda (Activity Group) */}
              {(!targetActivity || isEditingActivity) && (
                <div>
                  <label htmlFor="activityName" className={labelClass}>Nome da Demanda (Agrupador) <span className="text-brand-500">*</span></label>
                  <input 
                    type="text" 
                    id="activityName"
                    name="activityName"
                    required
                    value={formData.activityName}
                    onChange={handleChange}
                    placeholder="Ex: Mapeamento de Processos"
                    className={inputClass}
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Este será o título do grupo de tarefas na lista.</p>
                </div>
              )}

              {/* Campos da Tarefa (Só aparecem se NÃO estivermos editando apenas o nome do grupo) */}
              {!isEditingActivity && (
                <div className={targetActivity ? "pt-4 border-t border-slate-100 dark:border-slate-700" : ""}>
                   {targetActivity && (
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                         Detalhes da Tarefa
                      </h3>
                   )}

                  <div className="space-y-6">
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
                        <label htmlFor="deadline" className={labelClass}>Prazo (Data) <span className="text-brand-500">*</span></label>
                        <div className="relative">
                          <input 
                              type="date" 
                              id="deadline"
                              name="deadline"
                              required
                              value={formData.deadline}
                              onChange={handleChange}
                              className={`${inputClass} dark:[color-scheme:dark] cursor-pointer`}
                          />
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        </div>
                      </div>
                    </div>

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
              )}

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
                  {isEditingActivity 
                    ? 'Atualizar Demanda'
                    : (editingTask ? 'Salvar Alterações' : 'Salvar')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (TASK) */}
      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Tarefa?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Esta ação removerá permanentemente a tarefa do projeto. Tem certeza?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteTask}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL (ACTIVITY GROUP) */}
      {activityToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Demanda Principal?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Isso excluirá a demanda principal <strong className="text-slate-800 dark:text-white">"{activityToDelete.name}"</strong> e todas as tarefas vinculadas a ela. A ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setActivityToDelete(null)}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteActivity}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
              >
                Sim, excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};