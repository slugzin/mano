import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, Building, Phone, CreditCard, CheckCircle, XCircle } from '../utils/icons';
import Button from '../components/ui/Button';
import LoadingScreen from '../components/ui/LoadingScreen';
import EmailConfirmationMessage from '../components/auth/EmailConfirmationMessage';
import { validateAndFormatCPF } from '../utils/validation';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, resendConfirmationEmail, loading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [cpf, setCpf] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let result;
      
      if (isLogin) {
        result = await signIn(email, password);
      } else {
        // Validar campos obrigatórios
        if (!fullName.trim()) {
          setError('Nome completo é obrigatório');
          setIsSubmitting(false);
          return;
        }
        if (!whatsapp.trim()) {
          setError('WhatsApp é obrigatório');
          setIsSubmitting(false);
          return;
        }
        if (!cpf.trim()) {
          setError('CPF é obrigatório');
          setIsSubmitting(false);
          return;
        }
        
        // Validar CPF antes de enviar
        if (!cpfValidation.isValid) {
          setError('CPF inválido. Verifique o número informado.');
          setIsSubmitting(false);
          return;
        }
        
        // Limpar formatação para envio
        const cleanWhatsapp = whatsapp.replace(/\D/g, '');
        const cleanCPF = cpf.replace(/\D/g, '');
        
        result = await signUp(email, password, fullName, cleanWhatsapp, cleanCPF);
      }

      if (result.error) {
        // Tratar erros específicos
        if (result.error.message.includes('Email not confirmed')) {
          setConfirmationEmail(email);
          setShowEmailConfirmation(true);
          setError('');
        } else if (result.error.message.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos.');
        } else {
          setError(result.error.message);
        }
      } else {
        if (isLogin) {
          // Redirecionar para admin se login bem-sucedido
          navigate('/admin');
        } else {
          // Para cadastro, mostrar mensagem de sucesso
          setConfirmationEmail(email);
          setShowEmailConfirmation(true);
          setError('');
          setIsLogin(true);
          setEmail('');
          setPassword('');
          setFullName('');
          setWhatsapp('');
          setCpf('');
          setCpfValidation({ isValid: false, isTouched: false });
        }
      }
    } catch (error: any) {
      setError(error.message || 'Erro inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingScreen page="default" />;
  }

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
              {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
            </h1>
            <p className="text-white/70 text-sm sm:text-lg px-2">
              {isLogin 
                ? 'Entre com suas credenciais para acessar o sistema'
                : 'Preencha os dados para criar sua conta'
              }
            </p>
          </div>

          {/* Form */}
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Nome completo (apenas no cadastro) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2 sm:mb-3">
                    Nome completo
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-sm sm:text-base"
                      placeholder="Digite seu nome completo"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* WhatsApp (apenas no cadastro) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2 sm:mb-3">
                    WhatsApp
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      type="tel"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatWhatsApp(e.target.value))}
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-sm sm:text-base"
                      placeholder="(41) 98844-8798 ou (41) 8844-8798"
                      required={!isLogin}
                      maxLength={16}
                    />
                  </div>
                </div>
              )}

              {/* CPF (apenas no cadastro) */}
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2 sm:mb-3">
                    CPF
                  </label>
                  <div className="relative">
                    <CreditCard size={18} className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50" />
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => handleCpfChange(e.target.value)}
                      onBlur={handleCpfBlur}
                      className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-white/5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-white/50 transition-all duration-200 text-sm sm:text-base ${
                        cpfValidation.isTouched
                          ? cpfValidation.isValid
                            ? 'border-green-500/50'
                            : 'border-red-500/50'
                          : 'border-white/20'
                      }`}
                      placeholder="000.000.000-00"
                      required={!isLogin}
                      maxLength={14}
                    />
                    
                    {/* Ícone de validação */}
                    {cpfValidation.isTouched && (
                      <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
                        {cpfValidation.isValid ? (
                          <CheckCircle size={18} className="text-green-400" />
                        ) : (
                          <XCircle size={18} className="text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Mensagem de erro do CPF */}
                  {cpfValidation.isTouched && !cpfValidation.isValid && cpfValidation.error && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <XCircle size={16} className="mr-1" />
                      {cpfValidation.error}
                    </p>
                  )}
                  
                  {/* Dica de CPF válido */}
                  {!cpfValidation.isTouched && (
                    <p className="mt-2 text-xs text-white/50">
                      Digite apenas os números do CPF
                    </p>
                  )}
                </div>
              )}

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
                disabled={isSubmitting || (!isLogin && !cpfValidation.isValid)}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2 sm:mr-3"></div>
                    <span className="text-sm sm:text-base">{isLogin ? 'Entrando...' : 'Criando conta...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Entrar' : 'Criar conta'
                )}
              </button>
            </form>

            {/* Toggle entre login/cadastro */}
            <div className="mt-6 sm:mt-8 text-center">
              <p className="text-white/70 text-sm sm:text-base">
                {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setEmail('');
                    setPassword('');
                    setFullName('');
                    setWhatsapp('');
                    setCpf('');
                    setCpfValidation({ isValid: false, isTouched: false });
                  }}
                  className="ml-2 text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  {isLogin ? 'Criar conta' : 'Fazer login'}
                </button>
              </p>
            </div>

            {/* Esqueci a senha */}
            {isLogin && (
              <div className="mt-4 sm:mt-6 text-center">
                <button
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-white/60 hover:text-white/80 transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-6 sm:mt-8">
            <p className="text-xs sm:text-sm text-white/50">
              © 2024 CaptaZap. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
      
      {/* Modal de confirmação de email */}
      {showEmailConfirmation && (
        <EmailConfirmationMessage
          email={confirmationEmail}
          onClose={() => setShowEmailConfirmation(false)}
          onResendEmail={async () => {
            try {
              const result = await resendConfirmationEmail(confirmationEmail);
              if (result.error) {
                alert('Erro ao reenviar email: ' + result.error.message);
              } else {
                alert('Email reenviado com sucesso!');
              }
            } catch (error) {
              alert('Erro ao reenviar email. Tente novamente.');
            }
          }}
        />
      )}
    </div>
  );
};

export default LoginPage;