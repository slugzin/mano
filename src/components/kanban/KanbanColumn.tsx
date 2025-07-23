import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import type { KanbanColumn as IKanbanColumn } from '../../types/kanban';
import type { EmpresaBanco } from '../../services/edgeFunctions';

interface KanbanColumnProps {
  column: IKanbanColumn;
  onDisparar: (empresa: EmpresaBanco) => void;
  isOver?: boolean;
  minWidthClass?: string;
}

export function KanbanColumn({ column, onDisparar, isOver, minWidthClass }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id
  });

  return (
    <div className={`
      flex flex-col h-full
      ${minWidthClass || 'min-w-[320px] max-w-[320px]'}
      transform transition-transform duration-300
      ${isOver ? 'scale-[1.02]' : 'scale-100'}
    `}>
      {/* Cabeçalho da Coluna */}
      <div className={`
        p-4 rounded-t-xl bg-gradient-to-r ${column.color} shadow-sm
        transition-all duration-300
        ${isOver ? 'shadow-lg shadow-accent/20' : ''}
      `}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center
              transition-all duration-300
              ${isOver ? 'scale-110 bg-white/30' : ''}
            `}>
              <span className="text-lg">
                {column.icon}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{column.title}</h3>
              <p className="text-white/70 text-xs">Empresas nesta etapa</p>
            </div>
          </div>
          <span className={`
            px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium
            transition-all duration-300
            ${isOver ? 'bg-white/30 scale-110' : ''}
          `}>
            {column.items.length}
          </span>
        </div>
      </div>

      {/* Lista de Cards */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-3 space-y-3 bg-card/50 backdrop-blur-sm border-x border-b border-border rounded-b-xl overflow-y-auto
          transition-colors duration-300
          ${isOver ? 'bg-card/70 border-accent/30' : ''}
        `}
        style={{ height: 'calc(100vh - 300px)' }}
      >
        {column.items.map((empresa) => (
          <KanbanCard
            key={empresa.id}
            empresa={empresa}
            onDisparar={onDisparar}
            isAContatar={column.id === 'a_contatar'}
          />
        ))}

        {column.items.length === 0 && (
          <div className={`
            flex flex-col items-center justify-center h-full text-center p-6
            transition-all duration-300
            ${isOver ? 'scale-105' : ''}
          `}>
            <div className={`
              w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center mb-3
              transition-all duration-300
              ${isOver ? 'scale-125 bg-accent/20' : ''}
            `}>
              <span className={`
                text-2xl transition-transform duration-300
                ${isOver ? 'scale-110' : ''}
              `}>
                {column.icon}
              </span>
            </div>
            <p className={`
              text-muted-foreground text-sm font-medium
              transition-colors duration-300
              ${isOver ? 'text-accent' : ''}
            `}>
              {isOver ? 'Solte aqui!' : 'Arraste empresas para esta coluna'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 