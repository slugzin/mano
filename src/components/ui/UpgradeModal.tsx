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
            <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Crown size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Limite Atingido</h3>
                    <p className="text-sm text-muted-foreground">Plano gratuito</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-4">
            <div className="flex space-x-1 bg-gray-50/50 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              {[
                { id: 'upgrade', label: 'Fazer Upgrade', icon: Crown },
                { id: 'feedback', label: 'Dar Feedback', icon: MessageCircle }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-[#512FEB] text-white shadow-sm'
                      : 'text-[#512FEB] dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {activeTab === 'upgrade' ? (
              <div className="space-y-4">
                {/* Reason */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <p className="text-sm text-foreground font-medium">
                    {reason}
                  </p>
                </div>

                {/* Current limits */}
                {remaining && (
                  <div className="bg-gray-50/50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-foreground mb-2">📊 Seus limites restantes:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                        <span className="text-muted-foreground">Empresas:</span>
                        <span className="font-semibold text-[#512FEB] dark:text-purple-400 ml-1">{remaining.empresas}</span>
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                        <span className="text-muted-foreground">Disparos:</span>
                        <span className="font-semibold text-[#512FEB] dark:text-purple-400 ml-1">{remaining.disparos}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={handleUpgrade}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-lg"
                >
                  <ExternalLink size={16} />
                  💬 Falar no WhatsApp
                </button>
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

                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift size={14} className="text-[#512FEB]" />
                    <span className="text-sm font-medium text-foreground">Recompensa por Feedback</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Feedbacks úteis podem ganhar bônus extras no seu plano!
                  </p>
                </div>

                <button
                  onClick={handleFeedback}
                  disabled={!feedback.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-lg disabled:cursor-not-allowed"
                >
                  <MessageCircle size={16} />
                  💬 Enviar no WhatsApp
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