import React, { useState } from 'react';
import { Project, SubActivity, TaskStatus, RecurrentMonthStatus } from '../types';
import { MONTHS, STATUS_COLORS, DMAIC_COLORS } from '../constants';
import { ArrowLeft, Plus, MoreHorizontal, Calendar, List, Trello, Clock } from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onUpdateProject }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'kanban' | 'recurrent'>('list');

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
    
    // Recalculate progress (simplified)
    const allSubs = updatedActivities.flatMap(a => a.subActivities);
    const completed = allSubs.filter(s => s.status === 'Concluído').length;
    const progress = allSubs.length > 0 ? Math.round((completed / allSubs.length) * 100) : 0;

    onUpdateProject({ ...project, activities: updatedActivities, progress });
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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200">
        <button onClick={onBack} className="flex items-center text-sm text-slate-500 hover:text-brand-600 mb-4 transition-colors">
          <ArrowLeft size={16} className="mr-1" />
          Voltar para Projetos
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{project.title}</h1>
              <span className={`px-2 py-1 rounded-md text-xs font-semibold ${project.status === 'Ativo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {project.status}
              </span>
            </div>
            <p className="text-slate-500 mt-1 max-w-2xl">{project.description}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase font-semibold">Progresso</p>
              <p className="text-xl font-bold text-brand-600">{project.progress}%</p>
            </div>
             <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
               <MoreHorizontal />
             </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-6 mt-8 border-b border-slate-200">
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
        
        {/* TAB: LIST VIEW (Similar to Image 1) */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Atividade Principal</th>
                    <th className="px-6 py-3 font-semibold">Sub-Atividade / Tarefa</th>
                    <th className="px-6 py-3 font-semibold">Responsável</th>
                    <th className="px-6 py-3 font-semibold text-center">Status</th>
                    <th className="px-6 py-3 font-semibold">Fase DMAIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.activities.map(activity => (
                    <React.Fragment key={activity.id}>
                      {activity.subActivities.map((sub, index) => (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                          {/* Only show activity name on first row of group */}
                          <td className="px-6 py-4 font-medium text-slate-900 border-r border-slate-50 group-hover:border-slate-100">
                            {index === 0 && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-400"></span>
                                {activity.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-700">{sub.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-xs flex items-center justify-center font-bold text-slate-600">
                                {sub.responsible.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-slate-600">{sub.responsible}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <select 
                              value={sub.status}
                              onChange={(e) => handleStatusChange(activity.id, sub.id, e.target.value as TaskStatus)}
                              className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-brand-500 outline-none appearance-none ${STATUS_COLORS[sub.status]}`}
                            >
                              <option value="Não Iniciado">Não Iniciado</option>
                              <option value="Em Andamento">Em Andamento</option>
                              <option value="Concluído">Concluído</option>
                              <option value="Bloqueado">Bloqueado</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${DMAIC_COLORS[sub.dmaic] || 'bg-gray-100 text-gray-800'}`}>
                              {sub.dmaic}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  {project.activities.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        Nenhuma atividade cadastrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
             <div className="p-4 border-t border-slate-200 bg-slate-50">
              <button className="flex items-center text-sm font-medium text-brand-600 hover:text-brand-700">
                <Plus size={16} className="mr-2" />
                Adicionar Nova Atividade
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
                            {/* In a real app, drag and drop would handle status change. Here we use a mini dropdown */}
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

        {/* TAB: RECURRENT (Matrix - Similar to Image 2) */}
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
                               {cell.status === 'PENDING' ? 'OK' : (cell.status === 'PENDING' ? '' : cell.status)}
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
    </div>
  );
};