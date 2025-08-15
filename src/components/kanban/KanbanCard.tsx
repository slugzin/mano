import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Star, MapPin, Phone, Globe, Calendar, Eye, Rocket } from '../../utils/icons';
import type { EmpresaBanco } from '../../services/edgeFunctions';

interface KanbanCardProps {
  empresa: EmpresaBanco;
  onDisparar: (empresa: EmpresaBanco) => void;
  onAbrirDetalhes?: (empresa: EmpresaBanco) => void;
  isAContatar?: boolean;
  isDragging?: boolean;
}

export function KanbanCard({ empresa, onDisparar, onAbrirDetalhes, isAContatar, isDragging }: KanbanCardProps) {
  
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
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`
          group relative bg-white dark:bg-gray-900 border border-border 
          rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300
          ${isDragging ? 'opacity-60 scale-95' : 'opacity-100 scale-100'}
          hover:border-accent/40
          kanban-card-hover
        `}
      >
        {/* Área de Drag - Header */}
        <div
          {...attributes}
          {...listeners}
          className="p-4 pb-2 cursor-grab active:cursor-grabbing relative group/drag"
        >
          {/* Indicador de arraste sutil */}
          <div className="drag-indicator group-hover/drag:visible">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 bg-accent rounded-full drag-pulse"></div>
              <span className="hidden sm:block">Arrastar</span>
            </div>
          </div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate mb-1">
                {empresa.empresa_nome}
              </h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                  {empresa.categoria || 'Sem categoria'}
                </span>
                {empresa.tem_whatsapp && (
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium flex items-center gap-1">
                    📱 WhatsApp
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Avaliação */}
          {empresa.avaliacao && (
            <div className="flex items-center gap-2 mb-2">
              <Star size={14} className="text-yellow-500" />
              <span className="text-gray-900 dark:text-white font-medium text-sm">{empresa.avaliacao}</span>
              {empresa.total_avaliacoes > 0 && (
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  ({empresa.total_avaliacoes} {empresa.total_avaliacoes === 1 ? 'avaliação' : 'avaliações'})
                </span>
              )}
            </div>
          )}

          {/* Endereço */}
          {empresa.endereco && (
            <div className="flex items-start gap-1.5 text-gray-600 dark:text-gray-400 text-xs mb-2">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{empresa.endereco}</span>
            </div>
          )}
        </div>

        {/* Área de Clique - Contatos e Botões */}
        <div className="px-4 pb-4">
          {/* Contatos */}
          <div className="space-y-1.5 mb-3">
            {empresa.telefone && (
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-green-500" />
                <a 
                  href={`tel:${empresa.telefone}`}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors text-xs"
                >
                  {empresa.telefone}
                </a>
              </div>
            )}

            {empresa.website && (
              <div className="flex items-center gap-2">
                <Globe size={12} className="text-blue-500" />
                <a 
                  href={empresa.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-xs truncate"
                >
                  {empresa.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {parseLinksAgendamento(empresa.links_agendamento).length > 0 && (
              <div className="flex items-center gap-2">
                <Calendar size={12} className="text-purple-500" />
                <a 
                  href={parseLinksAgendamento(empresa.links_agendamento)[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors text-xs"
                >
                  Agendamento Online
                </a>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              onClick={() => onAbrirDetalhes?.(empresa)}
              className="
                flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 
                transition-all duration-200 flex items-center justify-center gap-1.5 hidden md:flex
                info-button-hover info-button-glow
              "
            >
              <Eye size={12} className="info-button-bounce" />
              <span>Detalhes</span>
            </button>
            
            {isAContatar && empresa.tem_whatsapp && (
              <button
                onClick={() => onDisparar(empresa)}
                className="
                  flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                  rounded-lg text-xs font-medium transition-all duration-200
                  flex items-center justify-center gap-1.5 transform hover:scale-[1.02]
                "
              >
                <Rocket size={12} />
                <span>Disparar</span>
              </button>
            )}


          </div>
        </div>

        {/* Efeito de Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
      </div>
    </>
  );
} 