import React from 'react';
import { Mail, CheckCircle } from '../../utils/icons';

interface EmailConfirmationMessageProps {
  email: string;
  onResendEmail?: () => void;
  onClose?: () => void;
}

const EmailConfirmationMessage: React.FC<EmailConfirmationMessageProps> = ({
  email,
  onResendEmail,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Ícone */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
            <Mail size={32} className="text-blue-600 dark:text-blue-400" />
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Confirme seu email
          </h2>
          
          {/* Mensagem */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>. 
            Clique no link para ativar sua conta.
          </p>
          
          {/* Dicas */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Dicas:</p>
                <ul className="space-y-1 text-left">
                  <li>• Verifique sua caixa de spam</li>
                  <li>• Aguarde alguns minutos</li>
                  <li>• Use o mesmo email do cadastro</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Botões */}
          <div className="space-y-3">
            {onResendEmail && (
              <button
                onClick={onResendEmail}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Reenviar email
              </button>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailConfirmationMessage; 