-- Adicionar user_id na tabela whatsapp_instances
ALTER TABLE whatsapp_instances 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_instances_user_id ON whatsapp_instances(user_id);

-- Atualizar políticas RLS para whatsapp_instances
DROP POLICY IF EXISTS "Users can view whatsapp_instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert whatsapp_instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can update whatsapp_instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete whatsapp_instances" ON whatsapp_instances;

CREATE POLICY "whatsapp_instances_select_policy" ON whatsapp_instances
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "whatsapp_instances_insert_policy" ON whatsapp_instances
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "whatsapp_instances_update_policy" ON whatsapp_instances
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "whatsapp_instances_delete_policy" ON whatsapp_instances
  FOR DELETE USING (auth.uid() = user_id);

-- Comentário para documentação
COMMENT ON COLUMN whatsapp_instances.user_id IS 'ID do usuário proprietário da instância WhatsApp';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Coluna user_id adicionada na tabela whatsapp_instances';
  RAISE NOTICE 'Políticas RLS atualizadas para whatsapp_instances';
END $$; 