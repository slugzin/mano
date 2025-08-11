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
 * Validação de CPF usando o algoritmo oficial brasileiro
 * Fonte: Receita Federal do Brasil
 */

/**
 * Remove caracteres não numéricos de uma string
 */
export const removeNonDigits = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Valida se um CPF é válido usando o algoritmo oficial
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se o CPF for válido, false caso contrário
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove formatação
  const cleanCPF = removeNonDigits(cpf);
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF.charAt(9)) !== firstDigit) {
    return false;
  }
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(cleanCPF.charAt(10)) !== secondDigit) {
    return false;
  }
  
  return true;
};

/**
 * Formata CPF no padrão brasileiro (000.000.000-00)
 * @param cpf - CPF sem formatação
 * @returns CPF formatado
 */
export const formatCPF = (cpf: string): string => {
  const cleanCPF = removeNonDigits(cpf);
  
  if (cleanCPF.length <= 3) return cleanCPF;
  if (cleanCPF.length <= 6) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3)}`;
  if (cleanCPF.length <= 9) return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6)}`;
  
  return `${cleanCPF.slice(0, 3)}.${cleanCPF.slice(3, 6)}.${cleanCPF.slice(6, 9)}-${cleanCPF.slice(9, 11)}`;
};

/**
 * Valida e formata CPF, retornando erro se inválido
 * @param cpf - CPF a ser validado
 * @returns objeto com CPF formatado e status de validação
 */
export const validateAndFormatCPF = (cpf: string): { 
  formatted: string; 
  isValid: boolean; 
  error?: string; 
} => {
  const cleanCPF = removeNonDigits(cpf);
  
  if (cleanCPF.length === 0) {
    return { formatted: '', isValid: false, error: 'CPF é obrigatório' };
  }
  
  if (cleanCPF.length < 11) {
    return { formatted: formatCPF(cleanCPF), isValid: false, error: 'CPF deve ter 11 dígitos' };
  }
  
  if (!validateCPF(cleanCPF)) {
    return { formatted: formatCPF(cleanCPF), isValid: false, error: 'CPF inválido' };
  }
  
  return { formatted: formatCPF(cleanCPF), isValid: true };
};

/**
 * Exemplos de CPFs válidos para teste
 */
export const VALID_CPF_EXAMPLES = [
  '111.444.777-35',
  '123.456.789-09',
  '987.654.321-00',
  '000.000.001-91',
  '111.111.111-11' // Este é inválido (todos dígitos iguais)
];

/**
 * Exemplos de CPFs inválidos para teste
 */
export const INVALID_CPF_EXAMPLES = [
  '111.111.111-11', // Todos dígitos iguais
  '123.456.789-10', // Dígitos verificadores incorretos
  '000.000.000-00', // Todos dígitos iguais
  '111.444.777-34', // Primeiro dígito verificador incorreto
  '111.444.777-36'  // Segundo dígito verificador incorreto
];

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