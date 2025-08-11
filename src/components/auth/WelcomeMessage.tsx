import React from 'react';
import { CheckCircle, Sparkles, MessageCircle, Users, BarChart3 } from '../../utils/icons';

interface WelcomeMessageProps {
  onClose: () => void;
  onInitializeData: () => void;
  isInitializing: boolean;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  onClose,
  onInitializeData,
  isInitializing
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-white/10 rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center">
          {/* Ícone */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl mb-6 shadow-2xl">
            <Sparkles size={32} className="text-white" />
          </div>
          
          {/* Título */}
          <h2 className="text-3xl font-bold text-white mb-4">
            Bem-vindo ao CaptaZap! 🎉
          </h2>
          
          {/* Mensagem */}
          <p className="text-white/80 mb-8 text-lg">
            Vamos configurar sua conta com dados iniciais para você começar a usar o sistema.
          </p>
          
          {/* Recursos que serão criados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <MessageCircle size={24} className="text-purple-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-white">Fluxo de Mensagens</h3>
                  <p className="text-sm text-white/70">Template inicial para WhatsApp</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <Users size={24} className="text-green-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-white">Campanha Inicial</h3>
                  <p className="text-sm text-white/70">Estrutura para suas campanhas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <BarChart3 size={24} className="text-blue-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-white">Templates</h3>
                  <p className="text-sm text-white/70">Mensagens pré-definidas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle size={24} className="text-orange-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-white">Configuração</h3>
                  <p className="text-sm text-white/70">Tudo pronto para usar</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botões */}
          <div className="space-y-3">
            <button
              onClick={onInitializeData}
              disabled={isInitializing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInitializing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  Configurando sua conta...
                </div>
              ) : (
                'Começar Agora! 🚀'
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isInitializing}
              className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Configurar depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage; 