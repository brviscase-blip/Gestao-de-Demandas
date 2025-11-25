export type DMAICPhase = 'D - Definir' | 'M - Mensurar' | 'A - Analisar' | 'I - Implementar' | 'C - Controlar';

export type TaskStatus = 'Não Iniciado' | 'Em Andamento' | 'Concluído' | 'Bloqueado';

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
  id: string;
  title: string;
  type: string; // Novo campo: Tipo do Projeto
  description: string; // Mantido para compatibilidade (será preenchido com o Objetivo)
  justification?: string; // Novo campo: Justificativa
  objective?: string; // Novo campo: Objetivo
  benefits?: string; // Novo campo: Benefícios
  progress: number; // 0-100
  status: 'Ativo' | 'Em Espera' | 'Concluído';
  activities: Activity[];
  recurrentDemands: RecurrentDemand[];
  startDate: string;
  responsibleLead: string;
}

export interface DashboardStats {
  totalProjects: number;
  avgProgress: number;
  tasksByStatus: { name: string; value: number; color: string }[];
  projectsByStatus: { name: string; value: number; color: string }[];
}