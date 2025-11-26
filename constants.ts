import { Project, TaskStatus } from './types';

// ==========================================
// CONFIGURAÇÃO DE INTEGRAÇÃO (N8N)
// ==========================================
// Cole aqui a URL do seu Webhook do n8n (Método POST)
// Exemplo: 'https://seu-n8n.com/webhook/criar-projeto'
export const N8N_WEBHOOK_URL = 'https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook/criar-projeto';

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Monday.com inspired colors (Solid & Vibrant)
export const STATUS_COLORS: Record<TaskStatus, string> = {
  'Não Iniciado': 'bg-[#94a3b8] text-white hover:bg-slate-500', // Updated to specific grey #94a3b8
  'Em Andamento': 'bg-blue-500 text-white hover:bg-blue-600',       // Blue (or Orange like Monday's 'Working on it' #FDAB3D)
  'Concluído': 'bg-emerald-500 text-white hover:bg-emerald-600',     // Green
  'Bloqueado': 'bg-red-500 text-white hover:bg-red-600',             // Red
};

export const DMAIC_COLORS: Record<string, string> = {
  'D - Definir': 'bg-purple-500 text-white hover:bg-purple-600',
  'M - Mensurar': 'bg-indigo-500 text-white hover:bg-indigo-600',
  'A - Analisar': 'bg-cyan-500 text-white hover:bg-cyan-600',
  'I - Implementar': 'bg-orange-500 text-white hover:bg-orange-600',
  'C - Controlar': 'bg-teal-500 text-white hover:bg-teal-600',
};

// Array vazio para iniciar a aplicação sem dados locais.
// Os dados deverão ser populados via API (PostgreSQL/n8n).
export const INITIAL_PROJECTS: Project[] = [];