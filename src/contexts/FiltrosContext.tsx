import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FiltrosAvancados {
  apenasComWebsite: boolean;
  apenasComWhatsApp: boolean;
  apenasSemWebsite: boolean;
  avaliacaoMinima: number;
  avaliacaoMaxima: number;
  apenasComTelefone: boolean;
  apenasComEndereco: boolean;
}

interface FiltrosContextType {
  filtrosAtivos: FiltrosAvancados;
  setFiltrosAtivos: (filtros: FiltrosAvancados) => void;
  temFiltrosAtivos: boolean;
  getFiltrosAtivosTexto: () => string;
}

const FiltrosContext = createContext<FiltrosContextType | undefined>(undefined);

export const useFiltros = () => {
  const context = useContext(FiltrosContext);
  if (context === undefined) {
    throw new Error('useFiltros deve ser usado dentro de um FiltrosProvider');
  }
  return context;
};

interface FiltrosProviderProps {
  children: ReactNode;
}

export const FiltrosProvider: React.FC<FiltrosProviderProps> = ({ children }) => {
  const [filtrosAtivos, setFiltrosAtivos] = useState<FiltrosAvancados>({
    apenasComWebsite: false,
    apenasComWhatsApp: false,
    apenasSemWebsite: false,
    avaliacaoMinima: 0,
    avaliacaoMaxima: 5,
    apenasComTelefone: false,
    apenasComEndereco: false
  });

  const temFiltrosAtivos = Object.values(filtrosAtivos).some(v => v !== false && v !== 0 && v !== 5);

  const getFiltrosAtivosTexto = () => {
    const filtros = [
      filtrosAtivos.apenasComWebsite && 'Com website',
      filtrosAtivos.apenasSemWebsite && 'Sem website',
      filtrosAtivos.apenasComWhatsApp && 'Com WhatsApp',
      filtrosAtivos.apenasComTelefone && 'Com telefone',
      filtrosAtivos.apenasComEndereco && 'Com endereço',
      filtrosAtivos.avaliacaoMinima > 0 && `Avaliação ≥ ${filtrosAtivos.avaliacaoMinima}`,
      filtrosAtivos.avaliacaoMaxima < 5 && `Avaliação ≤ ${filtrosAtivos.avaliacaoMaxima}`
    ].filter(Boolean);

    return filtros.join(', ');
  };

  return (
    <FiltrosContext.Provider value={{
      filtrosAtivos,
      setFiltrosAtivos,
      temFiltrosAtivos,
      getFiltrosAtivosTexto
    }}>
      {children}
    </FiltrosContext.Provider>
  );
}; 