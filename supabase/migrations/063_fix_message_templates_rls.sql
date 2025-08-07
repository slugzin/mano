-- Corrigir políticas RLS da tabela message_templates
-- O problema é que as políticas estão muito restritivas para INSERT

-- Verificar se a coluna user_id existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'message_templates' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE message_templates ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_message_templates_user_id ON message_templates(user_id);
    END IF;
END $$;

-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can insert own message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can update own message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can delete own message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can insert message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can update message_templates" ON message_templates;

-- Criar políticas mais flexíveis
CREATE POLICY "Users can view own message_templates" ON message_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert message_templates" ON message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own message_templates" ON message_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own message_templates" ON message_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE message_templates IS 'Tabela de templates de mensagens - Políticas RLS corrigidas para permitir inserções';

-- Log das correções
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS da tabela message_templates corrigidas';
  RAISE NOTICE 'Agora é possível inserir templates com user_id NULL ou igual ao usuário autenticado';
END $$; 