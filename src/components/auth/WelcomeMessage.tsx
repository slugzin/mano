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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center">
          {/* Ícone */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Sparkles size={32} className="text-white" />
          </div>
          
          {/* Título */}
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Bem-vindo ao Prospect CRM! 🎉
          </h2>
          
          {/* Mensagem */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
            Vamos configurar sua conta com dados iniciais para você começar a usar o sistema.
          </p>
          
          {/* Recursos que serão criados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <MessageCircle size={24} className="text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Fluxo de Mensagens</h3>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Template inicial para WhatsApp</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Users size={24} className="text-green-600 dark:text-green-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-green-800 dark:text-green-200">Campanha Inicial</h3>
                  <p className="text-sm text-green-600 dark:text-green-300">Estrutura para suas campanhas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <BarChart3 size={24} className="text-purple-600 dark:text-purple-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200">Templates</h3>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Mensagens pré-definidas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle size={24} className="text-orange-600 dark:text-orange-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200">Configuração</h3>
                  <p className="text-sm text-orange-600 dark:text-orange-300">Tudo pronto para usar</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botões */}
          <div className="space-y-3">
            <button
              onClick={onInitializeData}
              disabled={isInitializing}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInitializing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Configurando sua conta...
                </div>
              ) : (
                'Começar Agora! 🚀'
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isInitializing}
              className="w-full py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Configurar depois
            </button>
          </div>
          
          {/* Dica */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Você pode configurar isso a qualquer momento nas configurações
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeMessage; 