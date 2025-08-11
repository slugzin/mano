import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Building, Phone, CreditCard, CheckCircle, XCircle, ChevronRight, ChevronLeft, Check } from '../utils/icons';
import Button from '../components/ui/Button';
import LoadingScreen from '../components/ui/LoadingScreen';

import { validateAndFormatCPF } from '../utils/validation';

// Enum para as etapas do cadastro
enum CadastroStep {
  NOME = 0,
  WHATSAPP = 1,
  EMAIL = 2,
  CPF = 3,
  SENHA = 4,
  CONFIRMACAO = 5
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading } = useAuth();
  
  // Estados para o processo de cadastro por etapas
  const [currentStep, setCurrentStep] = useState<CadastroStep>(CadastroStep.NOME);
  const [isLogin, setIsLogin] = useState(false); // Começa direto no cadastro
  
  // Estados dos campos
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para validação em tempo real
  const [cpfValidation, setCpfValidation] = useState<{
    isValid: boolean;
    error?: string;
    isTouched: boolean;
  }>({ isValid: false, isTouched: false });

  // Função para formatar WhatsApp
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    // Se for apenas números, aplicar formatação
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    
    return numbers; // Retorna apenas números se for muito longo
  };

  // Função para validar CPF em tempo real
  const handleCpfChange = (value: string) => {
    const validation = validateAndFormatCPF(value);
    setCpf(validation.formatted);
    setCpfValidation({
      isValid: validation.isValid,
      error: validation.error,
      isTouched: true
    });
  };

  // Função para validar CPF quando o campo perde o foco
  const handleCpfBlur = () => {
    if (cpf && !cpfValidation.isValid) {
      setCpfValidation(prev => ({ ...prev, isTouched: true }));
    }
  };

  // Função para avançar para próxima etapa
  const nextStep = () => {
    if (currentStep < CadastroStep.CONFIRMACAO) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  // Função para voltar para etapa anterior
  const prevStep = () => {
    if (currentStep > CadastroStep.NOME) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  // Função para validar etapa atual
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case CadastroStep.NOME:
        return fullName.trim().length >= 3;
      case CadastroStep.WHATSAPP:
        return whatsapp.replace(/\D/g, '').length >= 10;
      case CadastroStep.EMAIL:
        return email.includes('@') && email.includes('.');
      case CadastroStep.CPF:
        return cpfValidation.isValid;
      case CadastroStep.SENHA:
        return password.length >= 6;
      case CadastroStep.CONFIRMACAO:
        return password === confirmPassword && password.length >= 6;
      default:
        return false;
    }
  };

  // Função para obter título da etapa atual
  const getStepTitle = (): string => {
    switch (currentStep) {
      case CadastroStep.NOME:
        return 'Como você se chama?';
      case CadastroStep.WHATSAPP:
        return 'Qual seu WhatsApp?';
      case CadastroStep.EMAIL:
        return 'Qual seu email?';
      case CadastroStep.CPF:
        return 'Qual seu CPF?';
      case CadastroStep.SENHA:
        return 'Crie uma senha';
      case CadastroStep.CONFIRMACAO:
        return 'Confirme sua senha';
      default:
        return '';
    }
  };

  // Função para obter descrição da etapa atual
  const getStepDescription = (): string => {
    switch (currentStep) {
      case CadastroStep.NOME:
        return 'Digite seu nome completo para começarmos';
      case CadastroStep.WHATSAPP:
        return 'Precisamos do seu WhatsApp para contato';
      case CadastroStep.EMAIL:
        return 'Seu email será usado para login e notificações';
      case CadastroStep.CPF:
        return 'Digite apenas os números do CPF';
      case CadastroStep.SENHA:
        return 'Crie uma senha segura para sua conta';
      case CadastroStep.CONFIRMACAO:
        return 'Digite novamente sua senha para confirmar';
      default:
        return '';
    }
  };

  // Função para renderizar campo da etapa atual
  const renderCurrentStepField = () => {
    const fieldVariants = {
      hidden: { opacity: 0, x: 50, scale: 0.95 },
      visible: { opacity: 1, x: 0, scale: 1 },
      exit: { opacity: 0, x: -50, scale: 0.95 }
    };

    switch (currentStep) {
      case CadastroStep.NOME:
        return (
          <motion.div
            key="nome"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateCurrentStep()) {
                  nextStep();
                }
              }}
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-base sm:text-lg"
              placeholder="Digite seu nome completo"
              autoFocus
            />
          </motion.div>
        );

      case CadastroStep.WHATSAPP:
        return (
          <motion.div
            key="whatsapp"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <Phone size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateCurrentStep()) {
                  nextStep();
                }
              }}
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-base sm:text-lg"
              placeholder="(41) 98844-8798 ou (41) 8844-8798"
              maxLength={16}
              autoFocus
            />
          </motion.div>
        );

      case CadastroStep.EMAIL:
        return (
          <motion.div
            key="email"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateCurrentStep()) {
                  nextStep();
                }
              }}
              className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-base sm:text-lg"
              placeholder="seu@email.com"
              autoFocus
            />
          </motion.div>
        );

      case CadastroStep.CPF:
        return (
          <motion.div
            key="cpf"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <CreditCard size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type="text"
              value={cpf}
              onChange={(e) => handleCpfChange(e.target.value)}
              onBlur={handleCpfBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateCurrentStep()) {
                  nextStep();
                }
              }}
              className={`w-full pl-12 pr-12 py-3 sm:py-4 bg-white/5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-base sm:text-lg ${
                cpfValidation.isTouched
                  ? cpfValidation.isValid
                    ? 'border-green-500/50'
                    : 'border-red-500/50'
                  : 'border-white/20'
              }`}
              placeholder="000.000.000-00"
              maxLength={14}
              autoFocus
            />
            
            {/* Ícone de validação */}
            {cpfValidation.isTouched && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {cpfValidation.isValid ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <XCircle size={20} className="text-red-400" />
                )}
              </div>
            )}
          </motion.div>
        );

      case CadastroStep.SENHA:
        return (
          <motion.div
            key="senha"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateCurrentStep()) {
                  nextStep();
                }
              }}
              className="w-full pl-12 pr-12 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-base sm:text-lg"
              placeholder="Digite sua senha"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </motion.div>
        );

      case CadastroStep.CONFIRMACAO:
        return (
          <motion.div
            key="confirmacao"
            variants={fieldVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="relative"
          >
            <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && validateCurrentStep()) {
                  handleSubmit(e as any);
                }
              }}
              className="w-full pl-12 pr-12 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-base sm:text-lg"
              placeholder="Digite novamente sua senha"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors p-1"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // Função para renderizar botões de navegação
  const renderNavigationButtons = () => {
    const canGoNext = validateCurrentStep();
    const canGoBack = currentStep > CadastroStep.NOME;

    return (
      <motion.div 
        className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {canGoBack && (
          <motion.button
            onClick={prevStep}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 px-4 sm:px-6 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 text-sm sm:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronLeft size={18} className="sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Voltar</span>
            <span className="sm:hidden">←</span>
          </motion.button>
        )}
        
        {currentStep < CadastroStep.CONFIRMACAO ? (
          <motion.button
            onClick={nextStep}
            disabled={!canGoNext}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="hidden sm:inline">Continuar</span>
            <span className="sm:hidden">→</span>
            <ChevronRight size={18} className="sm:w-5 sm:h-5" />
          </motion.button>
        ) : (
          <motion.button
            onClick={handleSubmit}
            disabled={!canGoNext || isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span className="hidden sm:inline">Criando conta...</span>
                <span className="sm:hidden">Criando...</span>
              </>
            ) : (
              <>
                <Check size={18} className="sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Criar conta</span>
                <span className="sm:hidden">Criar</span>
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    );
  };

  // Função para renderizar indicador de progresso simples
  const renderProgressIndicator = () => {
    const totalSteps = 6;
    const currentStepNumber = currentStep + 1;
    
    return (
      <motion.div 
        key={`progress-${currentStep}`}
        className="text-center mb-4 sm:mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="inline-flex items-center px-3 py-1.5 bg-white/10 border border-white/20 rounded-full">
          <span className="text-xs text-white/70 font-medium">
            Etapa {currentStepNumber} de {totalSteps}
          </span>
        </div>
      </motion.div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        // Login
        const result = await signIn(email, password);
        
        if (result.error) {
          // Tratar erros específicos
          if (result.error.message.includes('Invalid login credentials')) {
            setError('Email ou senha incorretos.');
          } else {
            setError(result.error.message);
          }
        } else {
          // Redirecionar para admin se login bem-sucedido
          navigate('/admin');
        }
      } else {
        // Cadastro
        // Validar se as senhas coincidem
        if (password !== confirmPassword) {
          setError('As senhas não coincidem');
          setIsSubmitting(false);
          return;
        }

        // Limpar formatação para envio
        const cleanWhatsapp = whatsapp.replace(/\D/g, '');
        const cleanCPF = cpf.replace(/\D/g, '');
        
        const result = await signUp(email, password, fullName, cleanWhatsapp, cleanCPF);

        if (result.error) {
          setError(result.error.message);
        } else {
          // Para cadastro bem-sucedido, redirecionar direto para o dashboard
          // Limpar todos os campos
          setFullName('');
          setWhatsapp('');
          setEmail('');
          setCpf('');
          setPassword('');
          setConfirmPassword('');
          setCpfValidation({ isValid: false, isTouched: false });
          setCurrentStep(CadastroStep.NOME);
          setError('');
          
          // Redirecionar para o dashboard
          navigate('/admin');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para alternar para login
  const switchToLogin = () => {
    setIsLogin(true);
    setError('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setWhatsapp('');
    setCpf('');
    setCpfValidation({ isValid: false, isTouched: false });
  };

  if (loading) {
    return <LoadingScreen page="default" />;
  }

  // Se estiver no modo login, mostrar formulário simples
  if (isLogin) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background com gradiente escuro e pontos decorativos */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900/20"></div>
        
        {/* Pontos decorativos (estrelas) */}
        <div className="absolute inset-0">
          <div className="absolute top-16 sm:top-20 left-16 sm:left-20 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute top-32 sm:top-40 right-24 sm:right-32 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-48 sm:top-60 left-1/4 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-64 sm:top-80 right-1/3 w-1 h-1 bg-white rounded-full opacity-30 animate-pulse" style={{animationDelay: '3s'}}></div>
          <div className="absolute top-80 sm:top-96 left-1/2 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6">
          <div className="w-full max-w-sm sm:max-w-md mx-auto">
            {/* Logo/Header */}
            <div className="text-center mb-6 sm:mb-8">
              {/* Logo CaptaZap */}
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl mb-4 sm:mb-6 shadow-2xl">
                <div className="grid grid-cols-2 gap-1 w-8 h-8 sm:w-10 sm:h-10">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-sm"></div>
                </div>
              </div>
              
              {/* Tag de marca */}
              <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-black/40 border border-white/20 rounded-full mb-3 sm:mb-4">
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-purple-500 rounded-sm mr-2"></div>
                <span className="text-xs text-white/80 font-medium hidden sm:inline">CaptaZap - Automação de Prospecção</span>
                <span className="text-xs text-white/80 font-medium sm:hidden">CaptaZap</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
                Bem-vindo de volta!
              </h1>
              <p className="text-white/70 text-sm sm:text-lg px-2">
                Entre com suas credenciais para acessar o sistema
              </p>
            </div>

            {/* Form de Login */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2 sm:mb-3">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-sm sm:text-base"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                {/* Senha */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2 sm:mb-3">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-sm sm:text-base"
                      placeholder="Digite sua senha"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/70 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Botão de submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                      <span className="text-sm sm:text-base">Entrando...</span>
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </button>
              </form>

              {/* Toggle para cadastro */}
              <div className="mt-6 sm:mt-8 text-center">
                <p className="text-white/70 text-sm sm:text-base">
                  Não tem uma conta?
                  <button
                    onClick={switchToLogin}
                    className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                  >
                    Criar conta
                  </button>
                </p>
              </div>

              {/* Esqueci a senha */}
              <div className="mt-4 sm:mt-6 text-center">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-white/60 hover:text-white/80 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 sm:mt-8">
              <p className="text-xs sm:text-sm text-white/50">
                © 2024 CaptaZap. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar processo de cadastro por etapas
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background com gradiente escuro e pontos decorativos */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-purple-900/20"></div>
      
      {/* Pontos decorativos (estrelas) */}
      <div className="absolute inset-0">
        <div className="absolute top-16 sm:top-20 left-16 sm:left-20 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 sm:top-40 right-24 sm:right-32 w-1 h-1 bg-white rounded-full opacity-40 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-48 sm:top-60 left-1/4 w-1 h-1 bg-white rounded-full opacity-50 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-64 sm:top-80 right-1/3 w-1 h-1 bg-white rounded-full opacity-30 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-80 sm:top-96 left-1/2 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto">
          {/* Logo/Header */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Logo CaptaZap */}
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-r from-purple-600 to-purple-800 rounded-2xl mb-3 sm:mb-4 md:mb-6 shadow-2xl">
              <div className="grid grid-cols-2 gap-1 w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10">
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-sm"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-sm"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-sm"></div>
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-white rounded-sm"></div>
              </div>
            </div>
            
            {/* Tag de marca */}
            <div className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 md:py-2 bg-black/40 border border-white/20 rounded-full mb-2 sm:mb-3 md:mb-4">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-purple-500 rounded-sm mr-1.5 sm:mr-2"></div>
              <span className="text-xs text-white/80 font-medium hidden md:inline">CaptaZap - Automação de Prospecção</span>
              <span className="text-xs text-white/80 font-medium hidden sm:inline md:hidden">CaptaZap</span>
              <span className="text-xs text-white/80 font-medium sm:hidden">CaptaZap</span>
            </div>

            {/* Indicador de Progresso */}
            {renderProgressIndicator()}

            <motion.h1 
              key={`title-${currentStep}`}
              className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 sm:mb-3 px-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {getStepTitle()}
            </motion.h1>
            <motion.p 
              key={`description-${currentStep}`}
              className="text-white/70 text-xs sm:text-sm md:text-lg px-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3, delay: 0.1, ease: "easeInOut" }}
            >
              {getStepDescription()}
            </motion.p>
          </div>

          {/* Form por Etapas */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Campo da etapa atual com animação */}
                <AnimatePresence mode="wait">
                  {renderCurrentStepField()}
                </AnimatePresence>

                {/* Mensagens de erro/ajuda específicas */}
                {currentStep === CadastroStep.CPF && cpfValidation.isTouched && !cpfValidation.isValid && cpfValidation.error && (
                  <motion.div 
                    className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-red-400 text-sm flex items-center">
                      <XCircle size={16} className="mr-2" />
                      {cpfValidation.error}
                    </p>
                  </motion.div>
                )}

                {currentStep === CadastroStep.CPF && !cpfValidation.isTouched && (
                  <motion.p 
                    className="mt-3 text-xs text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    Digite apenas os números do CPF
                  </motion.p>
                )}

                {currentStep === CadastroStep.SENHA && (
                  <motion.p 
                    className="mt-3 text-xs text-white/50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    Mínimo de 6 caracteres
                  </motion.p>
                )}

                {currentStep === CadastroStep.CONFIRMACAO && password !== confirmPassword && confirmPassword && (
                  <motion.div 
                    className="mt-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-red-400 text-sm flex items-center">
                      <XCircle size={16} className="mr-2" />
                      As senhas não coincidem
                    </p>
                  </motion.div>
                )}

                {/* Erro geral */}
                {error && (
                  <motion.div 
                    className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                {/* Botões de navegação */}
                {renderNavigationButtons()}

                {/* Toggle para login */}
                <motion.div 
                  className="mt-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <p className="text-white/70 text-sm">
                    Já tem uma conta?
                    <button
                      onClick={switchToLogin}
                      className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                    >
                      Fazer login
                    </button>
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-xs sm:text-sm text-white/50">
              © 2024 CaptaZap. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
      
      
    </div>
  );
};

export default LoginPage;