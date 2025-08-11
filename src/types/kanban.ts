import { EmpresaBanco } from '../services/edgeFunctions';

export type KanbanStatus = 
  | 'a_contatar'
  | 'contato_realizado'
  | 'em_negociacao'
  | 'ganhos'
  | 'perdidos';

export interface KanbanColumn {
  id: KanbanStatus;
  title: string;
  icon: string;
  color: string;
  items: EmpresaBanco[];
}

export interface KanbanState {
  columns: Record<KanbanStatus, KanbanColumn>;
  empresaStatus: Record<number, KanbanStatus>; // Mapeia ID da empresa -> status
}

export interface KanbanFilters {
  tipo: string;
  cidade: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'a_contatar',
    title: 'A Contatar',
    icon: '🎯',
    color: 'from-gray-700 to-gray-800',
    items: []
  },
  {
    id: 'contato_realizado',
    title: 'Contato Realizado',
    icon: '📨',
    color: 'from-blue-800 to-blue-900',
    items: []
  },
  {
    id: 'em_negociacao',
    title: 'Em Negociação',
    icon: '💬',
    color: 'from-purple-800 to-purple-900',
    items: []
  },
  {
    id: 'ganhos',
    title: 'Ganhos',
    icon: '🏆',
    color: 'from-green-800 to-green-900',
    items: []
  },
  {
    id: 'perdidos',
    title: 'Perdidos',
    icon: '❌',
    color: 'from-red-800 to-red-900',
    items: []
  }
]; 