-- Script para migrar dados existentes para o user_id correto
-- Este script deve ser executado apenas se houver dados existentes que precisam ser migrados

-- Função para migrar dados existentes para um usuário específico
CREATE OR REPLACE FUNCTION migrate_existing_data_to_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Migrar dados da tabela empresas (se existirem)
  UPDATE empresas 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  -- Migrar dados da tabela fluxos (se existirem)
  UPDATE fluxos 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  -- Migrar dados da tabela frases_whatsapp (se existirem)
  UPDATE frases_whatsapp 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  -- Migrar dados da tabela message_templates (se existirem)
  UPDATE message_templates 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  -- Migrar dados da tabela campanhas_disparo (se existirem)
  UPDATE campanhas_disparo 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  -- Migrar dados da tabela conversas (se existirem)
  UPDATE conversas 
  SET user_id = target_user_id 
  WHERE user_id IS NULL;
  
  RAISE NOTICE 'Dados migrados para usuário: %', target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpar dados órfãos (sem user_id)
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS VOID AS $$
BEGIN
  -- Deletar dados órfãos das tabelas principais
  DELETE FROM empresas WHERE user_id IS NULL;
  DELETE FROM fluxos WHERE user_id IS NULL;
  DELETE FROM frases_whatsapp WHERE user_id IS NULL;
  DELETE FROM message_templates WHERE user_id IS NULL;
  DELETE FROM campanhas_disparo WHERE user_id IS NULL;
  DELETE FROM conversas WHERE user_id IS NULL;
  
  RAISE NOTICE 'Dados órfãos removidos com sucesso';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para documentação
COMMENT ON FUNCTION migrate_existing_data_to_user IS 'Migra dados existentes para um usuário específico';
COMMENT ON FUNCTION cleanup_orphaned_data IS 'Remove dados órfãos (sem user_id) das tabelas';

-- Log das funções criadas
DO $$
BEGIN
  RAISE NOTICE 'Funções de migração criadas com sucesso';
  RAISE NOTICE 'Use migrate_existing_data_to_user(UUID) para migrar dados para um usuário';
  RAISE NOTICE 'Use cleanup_orphaned_data() para limpar dados órfãos';
END $$; 