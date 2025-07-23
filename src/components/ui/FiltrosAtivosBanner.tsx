import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from '../../utils/icons';
import { useFiltros } from '../../contexts/FiltrosContext';

interface FiltrosAtivosBannerProps {
  modalidadeSelecionada?: string | null;
  segmentoSelecionado?: string | null;
}

const FiltrosAtivosBanner: React.FC<FiltrosAtivosBannerProps> = ({ modalidadeSelecionada, segmentoSelecionado }) => {
  const { temFiltrosAtivos, getFiltrosAtivosTexto, setFiltrosAtivos } = useFiltros();

  const limparFiltros = () => {
    setFiltrosAtivos({
      apenasComWebsite: false,
      apenasComWhatsApp: false,
      apenasSemWebsite: false,
      avaliacaoMinima: 0,
      avaliacaoMaxima: 5,
      apenasComTelefone: false,
      apenasComEndereco: false
    });
  };

  return (
    <AnimatePresence>
      {(temFiltrosAtivos || modalidadeSelecionada || segmentoSelecionado) && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-accent/20 rounded">
                <Filter size={16} className="text-accent" />
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  {modalidadeSelecionada && (
                    <span>
                      Modalidade: <span className="text-accent">{modalidadeSelecionada === 'todas' ? 'Todas as empresas' : modalidadeSelecionada}</span>
                    </span>
                  )}
                  {segmentoSelecionado && (
                    <>
                      {(temFiltrosAtivos || modalidadeSelecionada) && <span>•</span>}
                      <span>
                        Segmento: <span className="text-accent">{segmentoSelecionado}</span>
                      </span>
                    </>
                  )}
                  {temFiltrosAtivos && (modalidadeSelecionada || segmentoSelecionado) && <span>•</span>}
                  {temFiltrosAtivos && (
                    <span>
                      Filtros: <span className="text-accent">{getFiltrosAtivosTexto()}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {temFiltrosAtivos && modalidadeSelecionada && segmentoSelecionado
                    ? 'Os dados estão sendo filtrados por modalidade, segmento e configurações avançadas'
                    : temFiltrosAtivos && modalidadeSelecionada
                    ? 'Os dados estão sendo filtrados por modalidade e configurações avançadas'
                    : temFiltrosAtivos && segmentoSelecionado
                    ? 'Os dados estão sendo filtrados por segmento e configurações avançadas'
                    : temFiltrosAtivos 
                    ? 'Os dados estão sendo filtrados com base nessas configurações'
                    : modalidadeSelecionada && segmentoSelecionado
                    ? 'Mostrando apenas empresas desta modalidade e segmento'
                    : modalidadeSelecionada
                    ? 'Mostrando apenas empresas desta modalidade'
                    : 'Segmento selecionado para disparo'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={limparFiltros}
              className="p-1 hover:bg-accent/20 rounded text-accent hover:text-accent/80 transition-colors"
              title="Limpar filtros"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FiltrosAtivosBanner; 