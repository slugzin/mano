-- Criar tabela conversas para armazenar mensagens recebidas
CREATE TABLE IF NOT EXISTS conversas (
  id SERIAL PRIMARY KEY,
  telefone VARCHAR(50) NOT NULL, -- remoteJid limpo (ex: 554198273444)
  nome_empresa VARCHAR(255), -- pushName ou nome da empresa
  mensagem TEXT NOT NULL, -- conversation
  from_me BOOLEAN NOT NULL DEFAULT false, -- se a mensagem foi enviada por nós
  message_id VARCHAR(100), -- id da mensagem do WhatsApp
  instance_name VARCHAR(100), -- nome da instância
  instance_id UUID, -- instanceId
  message_timestamp BIGINT, -- timestamp da mensagem
  message_type VARCHAR(50), -- tipo da mensagem (conversation, etc)
  status VARCHAR(50), -- status da mensagem (SERVER_ACK, DELIVERY_ACK, etc)
  criado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversas_telefone ON conversas(telefone);
CREATE INDEX IF NOT EXISTS idx_conversas_from_me ON conversas(from_me);
CREATE INDEX IF NOT EXISTS idx_conversas_criado_em ON conversas(criado_em);
CREATE INDEX IF NOT EXISTS idx_conversas_instance_id ON conversas(instance_id);

-- Trigger para atualizar atualizado_em
CREATE OR REPLACE FUNCTION update_conversas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversas_updated_at
    BEFORE UPDATE ON conversas
    FOR EACH ROW
    EXECUTE FUNCTION update_conversas_updated_at(); 