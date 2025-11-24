import React from 'react';
import { LayoutDashboard, FolderKanban, Settings, LogOut, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeView: 'dashboard' | 'project-list' | 'project-detail';
  onChangeView: (view: 'dashboard' | 'project-list') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView }) => {
  const getLinkClass = (viewName: string) => {
    const isActive = activeView === viewName || (viewName === 'project-list' && activeView === 'project-detail');
    return `flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors duration-200 ${
      isActive 
        ? 'bg-brand-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-slate-900 border-r border-slate-800 shrink-0 sticky top-0">
      <div className="flex items-center px-6 h-16 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
            P
          </div>
          ProGestão
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Principal</p>
        
        <button onClick={() => onChangeView('dashboard')} className={getLinkClass('dashboard')}>
          <LayoutDashboard size={20} className="mr-3" />
          <span className="font-medium">Dashboard Geral</span>
        </button>

        <button onClick={() => onChangeView('project-list')} className={getLinkClass('project-list')}>
          <FolderKanban size={20} className="mr-3" />
          <span className="font-medium">Meus Projetos</span>
        </button>

        <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-8">Configurações</p>
        
        <button className="flex items-center w-full px-4 py-3 mb-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <Settings size={20} className="mr-3" />
          <span className="font-medium">Sistema</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
            RA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Rafael (Analista)</p>
            <p className="text-xs text-slate-500 truncate">Melhoria Contínua</p>
          </div>
          <LogOut size={16} className="text-slate-500 cursor-pointer hover:text-white" />
        </div>
      </div>
    </div>
  );
};