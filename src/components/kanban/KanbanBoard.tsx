import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverEvent, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { DragOverlay } from './DragOverlay';
import { useKanban } from '../../hooks/useKanban';
import type { EmpresaBanco } from '../../services/edgeFunctions';
import type { KanbanStatus } from '../../types/kanban';

interface KanbanBoardProps {
  empresas: EmpresaBanco[];
}

export function KanbanBoard({ empresas }: KanbanBoardProps) {
  const { state, moveEmpresa, dispararMensagem } = useKanban(empresas);
  const [activeItem, setActiveItem] = useState<EmpresaBanco | null>(null);
  const [overColumn, setOverColumn] = useState<KanbanStatus | null>(null);

  // Configurar sensores para drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10 // Distância mínima para iniciar o drag
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Delay para iniciar o drag em touch
        tolerance: 5 // Tolerância de movimento
      }
    })
  );

  // Manipular início do drag
  const handleDragStart = (event: DragStartEvent) => {
    const empresaId = parseInt(event.active.id.toString().replace('empresa-', ''));
    const empresa = Object.values(state.columns)
      .flatMap(col => col.items)
      .find(e => e.id === empresaId);
    
    if (empresa) {
      setActiveItem(empresa);
    }
  };

  // Manipular drag sobre coluna
  const handleDragOver = (event: DragOverEvent) => {
    if (!event.over) {
      setOverColumn(null);
      return;
    }

    const newOverColumn = event.over.id as KanbanStatus;
    setOverColumn(newOverColumn);
  };

  // Manipular fim do drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveItem(null);
    setOverColumn(null);

    if (!over) return;

    const empresaId = parseInt(active.id.toString().replace('empresa-', ''));
    const fromStatus = Object.entries(state.columns).find(
      ([_, col]) => col.items.some(e => e.id === empresaId)
    )?.[0] as KanbanStatus;
    const toStatus = over.id as KanbanStatus;

    if (fromStatus && toStatus && fromStatus !== toStatus) {
      moveEmpresa(empresaId, fromStatus, toStatus);
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="
        flex gap-2 sm:gap-4 
        overflow-x-auto pb-2 sm:pb-4 
        scrollbar-thin scrollbar-thumb-accent/30 scrollbar-track-transparent
        -mx-6 px-6 sm:mx-0 sm:px-0 /* Permite scroll edge-to-edge em mobile */
        snap-x snap-mandatory /* Adiciona snap scroll para melhor UX */
      ">
        {Object.values(state.columns).map((column) => (
          <div key={column.id} className="snap-center">
            <KanbanColumn
              column={column}
              onDisparar={dispararMensagem}
              isOver={overColumn === column.id}
              minWidthClass="min-w-[280px] sm:min-w-[320px] max-w-[320px]"
            />
          </div>
        ))}
      </div>

      <DragOverlay
        draggedItem={activeItem}
        onDisparar={dispararMensagem}
      />
    </DndContext>
  );
} 