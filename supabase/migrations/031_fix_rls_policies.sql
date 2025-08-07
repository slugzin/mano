-- Corrigir políticas RLS que estão muito restritivas
-- O problema é que as políticas de INSERT precisam ser mais flexíveis

-- Políticas para tabela empresas
DROP POLICY IF EXISTS "Users can insert own empresas" ON empresas;
DROP POLICY IF EXISTS "Users can update own empresas" ON empresas;

CREATE POLICY "Users can insert empresas" ON empresas
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own empresas" ON empresas
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tabela fluxos
DROP POLICY IF EXISTS "Users can insert own fluxos" ON fluxos;
DROP POLICY IF EXISTS "Users can update own fluxos" ON fluxos;

CREATE POLICY "Users can insert fluxos" ON fluxos
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own fluxos" ON fluxos
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tabela message_templates
DROP POLICY IF EXISTS "Users can insert own message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can update own message_templates" ON message_templates;

CREATE POLICY "Users can insert message_templates" ON message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own message_templates" ON message_templates
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tabela campanhas_disparo
DROP POLICY IF EXISTS "Users can insert own campanhas_disparo" ON campanhas_disparo;
DROP POLICY IF EXISTS "Users can update own campanhas_disparo" ON campanhas_disparo;

CREATE POLICY "Users can insert campanhas_disparo" ON campanhas_disparo
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own campanhas_disparo" ON campanhas_disparo
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tabela conversas
DROP POLICY IF EXISTS "Users can insert own conversas" ON conversas;
DROP POLICY IF EXISTS "Users can update own conversas" ON conversas;

CREATE POLICY "Users can insert conversas" ON conversas
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own conversas" ON conversas
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para tabela frases_whatsapp (já tem usuario_id, mas vamos ajustar)
DROP POLICY IF EXISTS "Users can insert own frases_whatsapp" ON frases_whatsapp;
DROP POLICY IF EXISTS "Users can update own frases_whatsapp" ON frases_whatsapp;

CREATE POLICY "Users can insert frases_whatsapp" ON frases_whatsapp
  FOR INSERT WITH CHECK (auth.uid() = usuario_id OR usuario_id IS NULL);

CREATE POLICY "Users can update own frases_whatsapp" ON frases_whatsapp
  FOR UPDATE USING (auth.uid() = usuario_id);

-- Comentários explicativos
COMMENT ON TABLE empresas IS 'Tabela de empresas - Políticas RLS corrigidas para permitir inserções';
COMMENT ON TABLE fluxos IS 'Tabela de fluxos - Políticas RLS corrigidas para permitir inserções';
COMMENT ON TABLE message_templates IS 'Tabela de templates - Políticas RLS corrigidas para permitir inserções';
COMMENT ON TABLE campanhas_disparo IS 'Tabela de campanhas - Políticas RLS corrigidas para permitir inserções';
COMMENT ON TABLE conversas IS 'Tabela de conversas - Políticas RLS corrigidas para permitir inserções';

-- Log das correções
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS corrigidas com sucesso';
  RAISE NOTICE 'Agora é possível inserir dados com user_id NULL ou igual ao usuário autenticado';
END $$; 