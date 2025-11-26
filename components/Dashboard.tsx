
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { Project, SubActivity } from '../types';
import { CheckCircle2, Clock, AlertCircle, Briefcase } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
}

export const Dashboard: React.FC<DashboardProps> = ({ projects }) => {
  
  // Calculate Stats
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let delayedTasks = 0; 
    let pendingTasks = 0;
    
    projects.forEach(p => {
      p.activities.forEach(a => {
        a.subActivities.forEach(s => {
          totalTasks++;
          if (s.status === 'Concluído') completedTasks++;
          if (s.status === 'Não Iniciado') pendingTasks++;
          if (s.status === 'Bloqueado') delayedTasks++;
        });
      });
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return { totalTasks, completedTasks, delayedTasks, pendingTasks, completionRate };
  }, [projects]);

  // Chart Data Preparation
  const projectProgressData = projects.map(p => ({
    name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
    progress: p.progress,
  }));

  const tasksByStatusData = [
    { name: 'Concluído', value: stats.completedTasks, color: '#10b981' },
    { name: 'Em Andamento', value: stats.totalTasks - stats.completedTasks - stats.pendingTasks - stats.delayedTasks, color: '#3b82f6' },
    { name: 'Não Iniciado', value: stats.pendingTasks, color: '#94a3b8' },
    { name: 'Bloqueado', value: stats.delayedTasks, color: '#ef4444' },
  ].filter(i => i.value > 0);

  const responsibleDataMap: Record<string, number> = {};
  projects.forEach(p => {
    p.activities.forEach(a => {
      a.subActivities.forEach(s => {
        responsibleDataMap[s.responsible] = (responsibleDataMap[s.responsible] || 0) + 1;
      });
    });
  });
  const responsibleChartData = Object.keys(responsibleDataMap).map(key => ({
    name: key,
    tasks: responsibleDataMap[key]
  }));

  const cardClass = "bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors";
  const titleClass = "text-3xl font-bold text-slate-900 dark:text-white mt-1";
  const labelClass = "text-sm font-medium text-slate-500 dark:text-slate-400";
  const subTextClass = "mt-4 text-sm text-slate-500 dark:text-slate-400";

  return (
    <div className="p-8 space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Geral</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Visão consolidada de todos os projetos de Melhoria Contínua.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={labelClass}>Total Projetos</p>
              <h3 className={titleClass}>{projects.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Briefcase size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600 dark:text-green-400">
            <span className="font-medium">100%</span>
            <span className="ml-2 text-slate-400">ativos</span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={labelClass}>Taxa de Conclusão Global</p>
              <h3 className={titleClass}>{stats.completionRate}%</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 size={24} />
            </div>
          </div>
           <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-4">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${stats.completionRate}%` }}></div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={labelClass}>Demandas Pendentes</p>
              <h3 className={titleClass}>{stats.pendingTasks}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Clock size={24} />
            </div>
          </div>
          <p className={subTextClass}>Necessitam atenção</p>
        </div>

        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <div>
              <p className={labelClass}>Bloqueados/Risco</p>
              <h3 className={titleClass}>{stats.delayedTasks}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className={subTextClass}>Demandas críticas</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Project Progress */}
        <div className={`${cardClass} h-96`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Avanço por Projeto (%)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={projectProgressData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis type="number" domain={[0, 100]} tick={{fill: '#94a3b8'}} />
              <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12, fill: '#94a3b8'}} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.1)'}} 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: '#fff', color: '#1e293b' }} 
              />
              <Bar dataKey="progress" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className={`${cardClass} h-96`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Status das Demandas</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={tasksByStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {tasksByStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 text-xs mt-[-20px] text-slate-500 dark:text-slate-400">
            {tasksByStatusData.map(item => (
              <div key={item.name} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

       {/* Charts Row 2 */}
       <div className="grid grid-cols-1 gap-8">
        <div className={`${cardClass} h-80`}>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Volume de Demandas por Responsável</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={responsibleChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis dataKey="name" tick={{fill: '#94a3b8'}} />
              <YAxis tick={{fill: '#94a3b8'}} />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.1)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="tasks" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
