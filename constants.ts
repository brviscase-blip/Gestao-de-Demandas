import { Project, RecurrentDemand, TaskStatus, DMAICPhase } from './types';

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

// --- Mock Data Generators ---

const generateRecurrentData = (idPrefix: string): RecurrentDemand[] => [
  {
    id: `${idPrefix}-r1`,
    theme: 'Auditoria 6s',
    data: Array.from({ length: 12 }, (_, i) => ({ monthIndex: i, status: i < 9 ? 'OK' : 'PENDING' }))
  },
  {
    id: `${idPrefix}-r2`,
    theme: 'Kaizen',
    data: Array.from({ length: 12 }, (_, i) => ({ monthIndex: i, status: i < 9 ? 'X' : '-' }))
  },
  {
    id: `${idPrefix}-r3`,
    theme: 'Dados Mensais',
    data: Array.from({ length: 12 }, (_, i) => ({ monthIndex: i, status: i % 2 === 0 ? 'OK' : 'PENDING' }))
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Dimensionamento de Mão de Obra',
    description: 'Projeto focado em otimizar a alocação de recursos na linha de produção.',
    progress: 35,
    status: 'Ativo',
    startDate: '2023-10-01',
    responsibleLead: 'Rafael',
    recurrentDemands: generateRecurrentData('p1'),
    activities: [
      {
        id: 'a1',
        name: 'Material MDO',
        subActivities: [
          { id: 'sa1', name: 'Conseguir as demandas pendentes', responsible: 'Rafael', status: 'Não Iniciado', dmaic: 'M - Mensurar' },
          { id: 'sa2', name: 'Dar continuidade com a estrutura do MDO', responsible: 'Rick', status: 'Concluído', dmaic: 'M - Mensurar' },
          { id: 'sa3', name: 'Reestruturar o modelo do Recebimento', responsible: 'Rafael', status: 'Em Andamento', dmaic: 'A - Analisar' },
        ]
      },
      {
        id: 'a2',
        name: 'Análise de Tempos',
        subActivities: [
          { id: 'sa4', name: 'Cronometragem Setor A', responsible: 'João', status: 'Não Iniciado', dmaic: 'M - Mensurar' }
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'Fluxo Operacional Expedição',
    description: 'Revisão completa do fluxo de saída de materiais e lógica de carregamento.',
    progress: 68,
    status: 'Ativo',
    startDate: '2023-09-15',
    responsibleLead: 'Rick',
    recurrentDemands: generateRecurrentData('p2'),
    activities: [
      {
        id: 'a3',
        name: 'Elaborar Material de Treinamento',
        subActivities: [
          { id: 'sa5', name: 'Elaborar Material para AUX Operacional', responsible: 'Rafael', status: 'Não Iniciado', dmaic: 'I - Implementar' },
          { id: 'sa6', name: 'Elaborar Material para AUX Sistema', responsible: 'Rafael', status: 'Não Iniciado', dmaic: 'I - Implementar' },
        ]
      },
      {
        id: 'a4',
        name: 'Implementação do SMO',
        subActivities: [
          { id: 'sa7', name: 'Acompanhar Implementação Turno 1', responsible: 'Rafael', status: 'Concluído', dmaic: 'I - Implementar' },
          { id: 'sa8', name: 'Acompanhar Implementação Turno 2', responsible: 'Rick', status: 'Em Andamento', dmaic: 'I - Implementar' },
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'Gestão de Máquinas',
    description: 'Implementação de telemetria básica e controle de manutenção autônoma.',
    progress: 12,
    status: 'Em Espera',
    startDate: '2023-11-01',
    responsibleLead: 'Rafael',
    recurrentDemands: [],
    activities: [
      {
        id: 'a5',
        name: 'Painel de Locação',
        subActivities: [
          { id: 'sa9', name: 'Atualizar Indicadores', responsible: 'Rafael', status: 'Em Andamento', dmaic: 'M - Mensurar' }
        ]
      }
    ]
  }
];