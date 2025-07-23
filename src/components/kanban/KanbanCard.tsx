import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Star, MapPin, Phone, Globe, Calendar } from '../../utils/icons';
import type { EmpresaBanco } from '../../services/edgeFunctions';

interface KanbanCardProps {
  empresa: EmpresaBanco;
  onDisparar: (empresa: EmpresaBanco) => void;
  isAContatar?: boolean;
  isDragging?: boolean;
}

export function KanbanCard({ empresa, onDisparar, isAContatar, isDragging }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `empresa-${empresa.id}`,
    data: empresa
  });

  const style = transform ? {
    transform: CSS.Transform.toString(transform),
    transition: 'transform 0.2s ease-in-out'
  } : undefined;

  const parseLinksAgendamento = (links?: string) => {
    if (!links) return [];
    try {
      return JSON.parse(links) as string[];
    } catch {
      return [];
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        group relative bg-card backdrop-blur-sm border border-border rounded-xl overflow-hidden
        hover:border-accent/50 transition-all duration-300 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-0' : 'opacity-100'}
        transform-gpu hover:scale-[1.02] hover:-translate-y-1
        hover:shadow-xl hover:shadow-accent/10
      `}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-foreground line-clamp-2 mb-2">{empresa.titulo}</h3>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-full font-medium">
                {empresa.categoria || 'Sem categoria'}
              </span>
            </div>
          </div>
        </div>

        {/* Avaliação */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star size={14} className="text-yellow-500" />
            <span className="text-foreground font-medium text-sm">{empresa.avaliacao || 'N/A'}</span>
          </div>
          {empresa.total_avaliacoes > 0 && (
            <span className="text-muted-foreground text-xs">
              ({empresa.total_avaliacoes} {empresa.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})
            </span>
          )}
        </div>

        {/* Endereço */}
        {empresa.endereco && (
          <div className="flex items-start gap-1.5 text-muted-foreground text-xs">
            <MapPin size={12} className="mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{empresa.endereco}</span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Contatos */}
        <div className="space-y-2 mb-4">
          {empresa.telefone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-green-500" />
              <a 
                href={`tel:${empresa.telefone}`}
                className="text-green-500 hover:text-green-400 transition-colors text-sm"
              >
                {empresa.telefone}
              </a>
            </div>
          )}

          {empresa.website && (
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-blue-500" />
              <a 
                href={empresa.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors text-sm truncate"
              >
                {empresa.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}

          {parseLinksAgendamento(empresa.links_agendamento).length > 0 && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-purple-500" />
              <a 
                href={parseLinksAgendamento(empresa.links_agendamento)[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-500 hover:text-purple-400 transition-colors text-sm"
              >
                Agendamento Online
              </a>
            </div>
          )}
        </div>

        {/* Botão de Ação */}
        {isAContatar && (
          <button
            onClick={() => onDisparar(empresa)}
            className="
              w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-medium 
              hover:bg-accent/90 transition-all duration-300
              transform hover:scale-[1.02]
              relative overflow-hidden group/btn
            "
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            <div className="relative flex items-center justify-center gap-2">
              <span className="transform group-hover/btn:rotate-12 transition-transform duration-300">🚀</span>
              <span>Disparar Mensagem</span>
            </div>
          </button>
        )}
      </div>

      {/* Efeito de Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
    </div>
  );
} 