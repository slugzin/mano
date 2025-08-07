-- Adicionar coluna user_id nas tabelas para isolamento de usuários
-- Esta migração garante que cada usuário veja apenas seus próprios dados

-- 1. Adicionar user_id na tabela empresas
ALTER TABLE empresas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_empresas_user_id ON empresas(user_id);

-- 2. Adicionar user_id na tabela fluxos
ALTER TABLE fluxos 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_fluxos_user_id ON fluxos(user_id);

-- 3. Adicionar user_id na tabela message_templates
ALTER TABLE message_templates 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);

-- 4. Adicionar user_id na tabela campanhas_disparo
ALTER TABLE campanhas_disparo 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_campanhas_disparo_user_id ON campanhas_disparo(user_id);

-- 5. Adicionar user_id na tabela conversas
ALTER TABLE conversas 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversas_user_id ON conversas(user_id);

-- Atualizar políticas RLS para incluir user_id
-- Políticas para tabela empresas
DROP POLICY IF EXISTS "Users can view empresas" ON empresas;
DROP POLICY IF EXISTS "Users can insert empresas" ON empresas;
DROP POLICY IF EXISTS "Users can update empresas" ON empresas;
DROP POLICY IF EXISTS "Users can delete empresas" ON empresas;

CREATE POLICY "Users can view own empresas" ON empresas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own empresas" ON empresas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own empresas" ON empresas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own empresas" ON empresas
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela fluxos
DROP POLICY IF EXISTS "Users can view fluxos" ON fluxos;
DROP POLICY IF EXISTS "Users can insert fluxos" ON fluxos;
DROP POLICY IF EXISTS "Users can update fluxos" ON fluxos;
DROP POLICY IF EXISTS "Users can delete fluxos" ON fluxos;

CREATE POLICY "Users can view own fluxos" ON fluxos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fluxos" ON fluxos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fluxos" ON fluxos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fluxos" ON fluxos
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela message_templates
DROP POLICY IF EXISTS "Users can view message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can insert message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can update message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can delete message_templates" ON message_templates;

CREATE POLICY "Users can view own message_templates" ON message_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own message_templates" ON message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own message_templates" ON message_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own message_templates" ON message_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela campanhas_disparo
DROP POLICY IF EXISTS "Users can view campanhas_disparo" ON campanhas_disparo;
DROP POLICY IF EXISTS "Users can insert campanhas_disparo" ON campanhas_disparo;
DROP POLICY IF EXISTS "Users can update campanhas_disparo" ON campanhas_disparo;
DROP POLICY IF EXISTS "Users can delete campanhas_disparo" ON campanhas_disparo;

CREATE POLICY "Users can view own campanhas_disparo" ON campanhas_disparo
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campanhas_disparo" ON campanhas_disparo
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campanhas_disparo" ON campanhas_disparo
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campanhas_disparo" ON campanhas_disparo
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para tabela conversas
DROP POLICY IF EXISTS "Users can view conversas" ON conversas;
DROP POLICY IF EXISTS "Users can insert conversas" ON conversas;
DROP POLICY IF EXISTS "Users can update conversas" ON conversas;
DROP POLICY IF EXISTS "Users can delete conversas" ON conversas;

CREATE POLICY "Users can view own conversas" ON conversas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversas" ON conversas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversas" ON conversas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversas" ON conversas
  FOR DELETE USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON COLUMN empresas.user_id IS 'ID do usuário proprietário da empresa';
COMMENT ON COLUMN fluxos.user_id IS 'ID do usuário proprietário do fluxo';
COMMENT ON COLUMN message_templates.user_id IS 'ID do usuário proprietário do template';
COMMENT ON COLUMN campanhas_disparo.user_id IS 'ID do usuário proprietário da campanha';
COMMENT ON COLUMN conversas.user_id IS 'ID do usuário proprietário da conversa';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Colunas user_id adicionadas com sucesso em todas as tabelas principais';
  RAISE NOTICE 'Políticas RLS atualizadas para isolamento de usuários';
END $$; 