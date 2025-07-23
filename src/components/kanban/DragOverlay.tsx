import React from 'react';
import { DragOverlay as DndDragOverlay } from '@dnd-kit/core';
import { KanbanCard } from './KanbanCard';
import type { EmpresaBanco } from '../../services/edgeFunctions';

interface DragOverlayProps {
  draggedItem: EmpresaBanco | null;
  onDisparar: (empresa: EmpresaBanco) => void;
}

export function DragOverlay({ draggedItem, onDisparar }: DragOverlayProps) {
  if (!draggedItem) return null;

  return (
    <DndDragOverlay dropAnimation={{
      duration: 500,
      easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      sideEffects: defaultDropAnimationSideEffects({
        styles: {
          active: {
            opacity: '0.4',
          },
        },
      }),
    }}>
      <div style={{
        transform: 'rotate(-3deg) scale(1.02)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        <KanbanCard
          empresa={draggedItem}
          onDisparar={onDisparar}
          isDragging
        />
      </div>
    </DndDragOverlay>
  );
}

// Efeitos visuais durante o drag
function defaultDropAnimationSideEffects({ styles }: any) {
  return {
    Start({ active }: any) {
      if (!active.node) return;

      active.node.style.opacity = styles.active.opacity;
    },
    End({ active }: any) {
      if (!active.node) return;

      active.node.style.opacity = '';
    },
  };
} 