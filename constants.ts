import { Project, TaskStatus } from './types';

// ==========================================
// CONFIGURAÇÃO DE INTEGRAÇÃO (N8N)
// ==========================================
// Cole aqui a URL do seu Webhook do n8n (Método POST)
// Exemplo: 'https://seu-n8n.com/webhook/criar-projeto'
export const N8N_WEBHOOK_URL = 'https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook/Cadastro_de_Projetos';

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

// Colors updated to specific Hex codes requested
export const STATUS_COLORS: Record<TaskStatus, string> = {
  'Não Iniciado': 'bg-[#171d25] text-white hover:opacity-90',  // Dark
  'Em Andamento': 'bg-[#0a53a8] text-white hover:opacity-90',  // Blue
  'Concluído': 'bg-[#11734b] text-white hover:opacity-90',     // Green
  'Bloqueado': 'bg-[#ea4335] text-white hover:opacity-90',     // Red
};

export const DMAIC_COLORS: Record<string, string> = {
  'D - Definir': 'bg-[#ea4335] text-white hover:opacity-90',      // Red
  'M - Mensurar': 'bg-[#ffde00] text-slate-900 hover:opacity-90', // Yellow (Dark text for contrast)
  'A - Analisar': 'bg-[#011f5e] text-white hover:opacity-90',     // Deep Blue
  'I - Implementar': 'bg-[#0a53a8] text-white hover:opacity-90',  // Blue
  'C - Controlar': 'bg-[#171d25] text-white hover:opacity-90',    // Dark
  'Implementado': 'bg-[#11734b] text-white hover:opacity-90',     // Green
};

// Array vazio para iniciar a aplicação sem dados locais.
// Os dados deverão ser populados via API (PostgreSQL/n8n).
export const INITIAL_PROJECTS: Project[] = [];