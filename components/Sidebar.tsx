
import React from 'react';
import { LayoutDashboard, FolderKanban, Settings, LogOut, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeView: 'dashboard' | 'project-list' | 'project-detail';
  onChangeView: (view: 'dashboard' | 'project-list') => void;
  isOpen: boolean;
  onToggle: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onChangeView, isOpen, onToggle, theme, toggleTheme, user, onLogout }) => {
  const getLinkClass = (viewName: string) => {
    const isActive = activeView === viewName || (viewName === 'project-list' && activeView === 'project-detail');
    return `flex items-center px-4 py-3 mb-2 rounded-lg transition-colors duration-200 ${
      isActive 
        ? 'bg-brand-600 text-white shadow-md' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    } ${isOpen ? 'w-full' : 'justify-center'}`;
  };

  // Pega as iniciais do nome (ex: Rafael Rodrigues -> RR)
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`flex flex-col h-screen bg-slate-900 border-r border-slate-800 shrink-0 sticky top-0 transition-all duration-300 relative z-20 ${isOpen ? 'w-64' : 'w-20'}`}>
      
      {/* Toggle Button - Positioned on the edge with larger hit area */}
      <button 
        onClick={onToggle}
        className="absolute -right-4 top-8 w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:text-white border border-slate-700 rounded-full cursor-pointer z-50 shadow-md transition-colors"
        title={isOpen ? "Recolher menu" : "Expandir menu"}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Header */}
      <div className={`flex items-center h-16 border-b border-slate-800 ${isOpen ? 'px-6' : 'justify-center'}`}>
        <div className="flex items-center gap-2 font-bold text-xl text-white tracking-tight overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white shrink-0">
            P
          </div>
          {isOpen && <span className="transition-opacity duration-300">ProGestão</span>}
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 overflow-hidden">
        {isOpen && (
          <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 animate-fade-in">
            Principal
          </p>
        )}
        
        <button onClick={() => onChangeView('dashboard')} className={getLinkClass('dashboard')} title={!isOpen ? "Dashboard Geral" : ""}>
          <LayoutDashboard size={20} className={`${isOpen ? 'mr-3' : ''}`} />
          {isOpen && <span className="font-medium whitespace-nowrap">Dashboard Geral</span>}
        </button>

        <button onClick={() => onChangeView('project-list')} className={getLinkClass('project-list')} title={!isOpen ? "Meus Projetos" : ""}>
          <FolderKanban size={20} className={`${isOpen ? 'mr-3' : ''}`} />
          {isOpen && <span className="font-medium whitespace-nowrap">Meus Projetos</span>}
        </button>

        {isOpen && (
          <p className="px-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-8 animate-fade-in">
            Configurações
          </p>
        )}
        {!isOpen && <div className="my-4 border-t border-slate-800 mx-2"></div>}
        
        {/* THEME TOGGLE BUTTON */}
        <button 
          onClick={toggleTheme}
          className={`flex items-center px-4 py-3 mb-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors ${isOpen ? 'w-full' : 'justify-center'}`} 
          title={!isOpen ? (theme === 'dark' ? "Modo Claro" : "Modo Escuro") : ""}
        >
          {theme === 'dark' ? (
             <Sun size={20} className={`${isOpen ? 'mr-3' : ''} text-yellow-500`} />
          ) : (
             <Moon size={20} className={`${isOpen ? 'mr-3' : ''}`} />
          )}
          {isOpen && <span className="font-medium whitespace-nowrap">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className={`flex items-center gap-3 px-2 py-2 ${isOpen ? '' : 'justify-center'}`}>
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold shrink-0">
            {user ? getInitials(user.No) : '?'}
          </div>
          {isOpen && user && (
            <div className="flex-1 min-w-0 overflow-hidden animate-fade-in">
              <p className="text-sm font-medium text-white truncate">{user.No}</p>
              <p className="text-xs text-slate-500 truncate">{user.Tipo}</p>
            </div>
          )}
          {isOpen && (
            <button onClick={onLogout} title="Sair">
              <LogOut size={16} className="text-slate-500 cursor-pointer hover:text-red-400 shrink-0 transition-colors" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
