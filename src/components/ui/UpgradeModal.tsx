import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, MessageCircle, ExternalLink, Zap, Gift } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: string;
  remaining?: {
    empresas: number;
    disparos: number;
  };
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, reason, remaining }) => {
  const [activeTab, setActiveTab] = useState<'upgrade' | 'feedback'>('upgrade');
  const [feedback, setFeedback] = useState('');

  const whatsappNumber = '+5541988448798';

  const handleUpgrade = () => {
    const message = `Olá! Gostaria de fazer upgrade do meu plano. Motivo: ${reason}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
  };

  const handleFeedback = () => {
    if (!feedback.trim()) return;
    const message = `Feedback sobre o plano gratuito: ${feedback}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    setFeedback('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 p-6 border-b border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Crown size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">🚀 Upgrade Disponível!</h3>
                    <p className="text-sm text-purple-600 dark:text-purple-300">Desbloqueie todo o potencial do CaptaZap</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl transition-all duration-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-6">
            <div className="flex space-x-2 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              {[
                { id: 'upgrade', label: 'Fazer Upgrade', icon: Crown },
                { id: 'feedback', label: 'Dar Feedback', icon: MessageCircle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg transform scale-105'
                      : 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'upgrade' ? (
              <div className="space-y-4">
                {/* Reason */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚠️</span>
                    <h4 className="text-sm font-semibold text-orange-800 dark:text-orange-200">Limite Atingido</h4>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    {reason}
                  </p>
                </div>

                {/* Upgrade Benefits */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    Upgrade para Premium
                  </h4>
                  <div className="space-y-2 text-xs text-purple-700 dark:text-purple-300">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Empresas ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Disparos ilimitados</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Múltiplas conexões WhatsApp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Templates ilimitados</span>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-3">
                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <ExternalLink size={18} />
                    <span className="text-base">💬 Falar no WhatsApp</span>
                  </button>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">🎁 Desconto exclusivo</span> para novos usuários!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">💭 Sua opinião é importante!</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Como podemos melhorar o plano gratuito? Conte-nos sua experiência:
                  </p>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Ex: Gostaria de mais disparos por dia, ou seria útil ter mais templates..."
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-sm resize-none"
                    rows={4}
                  />
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift size={16} className="text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">🎁 Recompensa por Feedback</span>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Feedbacks úteis podem ganhar <span className="font-medium">bônus extras</span> no seu plano!
                  </p>
                </div>

                <button
                  onClick={handleFeedback}
                  disabled={!feedback.trim()}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <MessageCircle size={18} />
                  <span className="text-base">💬 Enviar no WhatsApp</span>
                </button>
              </div>
            )}
          </div>


        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UpgradeModal; 