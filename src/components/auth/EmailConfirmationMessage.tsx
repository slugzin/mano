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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/90 border border-white/10 rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          {/* Ícone */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl mb-6 shadow-2xl">
            <Mail size={32} className="text-white" />
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold text-white mb-3">
            Confirme seu email
          </h2>
          
          {/* Mensagem */}
          <p className="text-white/80 mb-6">
            Enviamos um link de confirmação para <strong className="text-white">{email}</strong>. 
            Clique no link para ativar sua conta.
          </p>
          
          {/* Dicas */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-3">
              <CheckCircle size={20} className="text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-white/90">
                <p className="font-medium mb-2">Dicas:</p>
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
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02]"
              >
                Reenviar email
              </button>
            )}
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl transition-all duration-200"
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