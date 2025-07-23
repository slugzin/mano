// Utilitários de validação para toda a aplicação

/**
 * Validação rigorosa de email
 * Aceita apenas emails com @ e domínios válidos (.com, .com.br, etc.)
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.(com|com\.br|org|net|edu|gov|mil|br|co\.uk|hotmail\.com|yahoo\.com|outlook\.com|live\.com)$/i;
  return emailRegex.test(email.trim());
};

/**
 * Validação de telefone brasileiro com DDD
 * Formato: (11) 99999-9999 ou (11) 9999-9999
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * Máscara para telefone brasileiro
 * Formata automaticamente enquanto o usuário digita
 */
export const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 2) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

/**
 * Validação de nome (mínimo 2 caracteres, apenas letras e espaços)
 */
export const validateName = (name: string): boolean => {
  const nameRegex = /^[a-zA-ZÀ-ÿ\s]{2,}$/;
  return nameRegex.test(name.trim());
};

/**
 * Limpar e formatar email (lowercase, trim)
 */
export const formatEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Validar CPF (apenas números, 11 dígitos)
 */
export const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  return numbers.length === 11;
};

/**
 * Máscara para CPF
 */
export const formatCPF = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
};

/**
 * Mensagens de erro padronizadas
 */
export const ValidationMessages = {
  EMAIL_INVALID: 'Email inválido. Use um formato como: exemplo@gmail.com',
  PHONE_INVALID: 'Telefone inválido. Use o formato: (11) 99999-9999',
  NAME_INVALID: 'Nome deve ter pelo menos 2 caracteres e apenas letras',
  REQUIRED_FIELD: 'Este campo é obrigatório',
  CPF_INVALID: 'CPF deve ter 11 dígitos'
}; 