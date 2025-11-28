export type DMAICPhase = 'D - Definir' | 'M - Mensurar' | 'A - Analisar' | 'I - Implementar' | 'C - Controlar';

export type TaskStatus = 'Não Iniciado' | 'Em Andamento' | 'Concluído' | 'Bloqueado';

export interface UserProfile {
  id: number;
  No: string; // Nome do Usuário
  Se: string; // Senha
  Tipo: string; // Cargo / Função
}

export interface SubActivity {
  id: string;
  name: string;
  responsible: string; // Could be 'Rafael', 'Rick', etc.
  status: TaskStatus;
  dmaic: DMAICPhase;
  deadline?: string;
}

export interface Activity {
  id: string;
  name: string;
  subActivities: SubActivity[];
}

export interface RecurrentMonthStatus {
  monthIndex: number; // 0 = Jan, 11 = Dec
  status: 'OK' | 'X' | '-' | 'PENDING';
}

export interface RecurrentDemand {
  id: string;
  theme: string;
  data: RecurrentMonthStatus[];
}

export interface Project {
  id: string; // DB: ID_Supabase_Projetos (ou id)
  title: string; // DB: Nome_do_Projeto
  type: string; // DB: Tipo_do_Projeto
  description: string; // Mapeado de Objetivo (Fallback)
  justification?: string; // DB: Justificativa
  objective?: string; // DB: Objetivo
  benefits?: string; // DB: Beneficios
  progress: number; // 0-100
  status: 'Ativo' | 'Em Espera' | 'Concluído';
  activities: Activity[];
  recurrentDemands: RecurrentDemand[];
  startDate: string; // DB: Data_de_Inicio
  responsibleLead: string; // DB: Responsavel
}

export interface DashboardStats {
  totalProjects: number;
  avgProgress: number;
  tasksByStatus: { name: string; value: number; color: string }[];
  projectsByStatus: { name: string; value: number; color: string }[];
}