import { Project, TaskStatus } from './types';

// ==========================================
// CONFIGURAÇÃO DE INTEGRAÇÃO (N8N)
// ==========================================
// Cole aqui a URL do seu Webhook do n8n (Método POST)
// Exemplo: 'https://seu-n8n.com/webhook/criar-projeto'
export const N8N_WEBHOOK_URL = 'https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Projetos';
export const N8N_WEBHOOK_DEMANDS_URL = 'https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Demandas';

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Colors updated to "Badge Style" (Subtle background, colored text, border)
// Matches the project header style for a cleaner, professional look.
export const STATUS_COLORS: Record<TaskStatus, string> = {
  'Não Iniciado': 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 font-bold',
  'Em Andamento': 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 font-bold',
  'Concluído':    'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 font-bold',
  'Bloqueado':    'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 font-bold',
};

export const DMAIC_COLORS: Record<string, string> = {
  'D - Definir':     'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 font-bold',
  'M - Mensurar':    'bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800 font-bold',
  'A - Analisar':    'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800 font-bold',
  'I - Implementar': 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 font-bold',
  'C - Controlar':   'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-bold',
};

// Array vazio para iniciar a aplicação sem dados locais.
// Os dados deverão ser populados via API (PostgreSQL/n8n).
export const INITIAL_PROJECTS: Project[] = [];