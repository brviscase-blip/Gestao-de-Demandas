import { Project, TaskStatus } from './types';

// ==========================================
// CONFIGURAÇÃO DE INTEGRAÇÃO (N8N)
// ==========================================
// Cole aqui a URL do seu Webhook do n8n (Método POST)
// Exemplo: 'https://seu-n8n.com/webhook/criar-projeto'
export const N8N_WEBHOOK_URL = 'https://projeto-teste-n8n.ly7t0m.easypanel.host/webhook-test/criar-projeto';

export const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const STATUS_COLORS: Record<TaskStatus, string> = {
  'Não Iniciado': 'bg-gray-200 text-gray-700 border-gray-300',
  'Em Andamento': 'bg-blue-100 text-blue-800 border-blue-200',
  'Concluído': 'bg-green-100 text-green-800 border-green-200',
  'Bloqueado': 'bg-red-100 text-red-800 border-red-200',
};

export const DMAIC_COLORS: Record<string, string> = {
  'D - Definir': 'text-purple-600 bg-purple-50',
  'M - Mensurar': 'text-indigo-600 bg-indigo-50',
  'A - Analisar': 'text-cyan-600 bg-cyan-50',
  'I - Implementar': 'text-orange-600 bg-orange-50',
  'C - Controlar': 'text-emerald-600 bg-emerald-50',
};

// Array vazio para iniciar a aplicação sem dados locais.
// Os dados deverão ser populados via API (PostgreSQL/n8n).
export const INITIAL_PROJECTS: Project[] = [];