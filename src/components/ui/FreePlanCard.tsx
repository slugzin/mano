import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowUp, Calendar, Zap } from 'lucide-react';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';

const FreePlanCard: React.FC = () => {
  const { limits, getRemainingLimit, setShowUpgradeModal, setUpgradeReason } = usePlanLimits();

  const handleUpgrade = () => {
    setUpgradeReason('Upgrade do plano.');
    setShowUpgradeModal(true);
  };

  const progressPercentage = (used: number, total: number) => {
    return Math.min((used / total) * 100, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-purple-500';
  };

  const empresasProgress = progressPercentage(limits.empresasUsadas, limits.maxEmpresas);
  const disparosProgress = progressPercentage(limits.disparosUsados, limits.maxDisparos);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-900/10 dark:to-purple-800/10 border border-purple-200 dark:border-purple-700 rounded-xl p-4 relative overflow-hidden backdrop-blur-sm"
    >
      {/* Background decoration - Minimalista */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200/20 dark:bg-purple-600/10 rounded-full -mr-8 -mt-8"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <Crown size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Plano Gratuito</h3>
            <p className="text-xs text-muted-foreground">Seus limites hoje</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
            <Calendar size={12} />
            <span>Reset diário</span>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="space-y-3 mb-4 relative z-10">
        {/* Empresas */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-purple-100/50 dark:border-purple-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">🔍 Empresas</span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {getRemainingLimit('empresas')}/{limits.maxEmpresas}
            </span>
          </div>
          <div className="w-full bg-purple-100 dark:bg-purple-900/40 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(empresasProgress)}`}
              style={{ width: `${empresasProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Disparos */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 border border-purple-100/50 dark:border-purple-700/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">🚀 Disparos</span>
            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
              {getRemainingLimit('disparos')}/{limits.maxDisparos}
            </span>
          </div>
          <div className="w-full bg-purple-100 dark:bg-purple-900/40 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(disparosProgress)}`}
              style={{ width: `${disparosProgress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Daily Bonus Info */}
      <div className="bg-purple-50/50 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-700/50 rounded-lg p-3 mb-4 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Zap size={14} className="text-purple-600" />
          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Bônus Diário</span>
        </div>
        <p className="text-xs text-purple-600 dark:text-purple-400">
          +{limits.empresasDiarias} empresas e +{limits.disparosDiarios} disparos todo dia!
        </p>
      </div>

      {/* Upgrade Button */}
      <button
        onClick={handleUpgrade}
        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-lg relative z-10"
      >
        <ArrowUp size={16} />
        Upgrade para Mais Leads
      </button>

      {/* Warning if limits are reached */}
      {(getRemainingLimit('empresas') === 0 || getRemainingLimit('disparos') === 0) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-2 relative z-10"
        >
          <p className="text-xs text-purple-700 dark:text-purple-300 text-center font-medium">
            ⚠️ Limites atingidos! Reset em 24h ou upgrade agora.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FreePlanCard; 