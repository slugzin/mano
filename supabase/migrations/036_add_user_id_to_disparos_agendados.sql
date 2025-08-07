-- Adicionar user_id na tabela disparos_agendados
ALTER TABLE disparos_agendados 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_disparos_agendados_user_id ON disparos_agendados(user_id);

-- Atualizar políticas RLS para disparos_agendados
DROP POLICY IF EXISTS "Users can view disparos_agendados" ON disparos_agendados;
DROP POLICY IF EXISTS "Users can insert disparos_agendados" ON disparos_agendados;
DROP POLICY IF EXISTS "Users can update disparos_agendados" ON disparos_agendados;
DROP POLICY IF EXISTS "Users can delete disparos_agendados" ON disparos_agendados;

CREATE POLICY "disparos_agendados_select_policy" ON disparos_agendados
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "disparos_agendados_insert_policy" ON disparos_agendados
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "disparos_agendados_update_policy" ON disparos_agendados
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "disparos_agendados_delete_policy" ON disparos_agendados
  FOR DELETE USING (auth.uid() = user_id);

-- Comentário para documentação
COMMENT ON COLUMN disparos_agendados.user_id IS 'ID do usuário proprietário do disparo agendado';

-- Log das alterações
DO $$
BEGIN
  RAISE NOTICE 'Coluna user_id adicionada na tabela disparos_agendados';
  RAISE NOTICE 'Políticas RLS atualizadas para disparos_agendados';
END $$; 