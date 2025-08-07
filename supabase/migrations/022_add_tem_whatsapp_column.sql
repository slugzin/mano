-- Adicionar coluna tem_whatsapp na tabela empresas
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS tem_whatsapp BOOLEAN DEFAULT FALSE;

-- Adicionar comentário na coluna
COMMENT ON COLUMN empresas.tem_whatsapp IS 'Indica se o número de telefone da empresa tem WhatsApp ativo'; 