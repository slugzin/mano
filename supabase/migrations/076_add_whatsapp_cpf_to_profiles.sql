-- Adicionar colunas whatsapp e cpf na tabela profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN profiles.whatsapp IS 'Número de WhatsApp do usuário';
COMMENT ON COLUMN profiles.cpf IS 'CPF do usuário';

-- Criar índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

-- Adicionar validação básica para CPF (formato brasileiro)
ALTER TABLE profiles 
ADD CONSTRAINT check_cpf_format 
CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$');

-- Adicionar validação para WhatsApp (formato brasileiro)
ALTER TABLE profiles 
ADD CONSTRAINT check_whatsapp_format 
CHECK (whatsapp IS NULL OR whatsapp ~ '^[0-9]{10,11}$'); 