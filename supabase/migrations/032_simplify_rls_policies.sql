-- Simplificar políticas RLS para permitir inserções
-- Vamos usar políticas mais simples que funcionem corretamente

-- Desabilitar RLS temporariamente para recriar as políticas
ALTER TABLE empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE fluxos DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_disparo DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversas DISABLE ROW LEVEL SECURITY;
ALTER TABLE frases_whatsapp DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own empresas" ON empresas;
DROP POLICY IF EXISTS "Users can insert empresas" ON empresas;
DROP POLICY IF EXISTS "Users can update own empresas" ON empresas;
DROP POLICY IF EXISTS "Users can delete own empresas" ON empresas;

DROP POLICY IF EXISTS "Users can view own fluxos" ON fluxos;
DROP POLICY IF EXISTS "Users can insert fluxos" ON fluxos;
DROP POLICY IF EXISTS "Users can update own fluxos" ON fluxos;
DROP POLICY IF EXISTS "Users can delete own fluxos" ON fluxos;

DROP POLICY IF EXISTS "Users can view own message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can insert message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can update own message_templates" ON message_templates;
DROP POLICY IF EXISTS "Users can delete own message_templates" ON message_templates;

DROP POLICY IF EXISTS "Users can view own campanhas_disparo" ON campanhas_disparo;
DROP POLICY IF EXISTS "Users can insert campanhas_disparo" ON campanhas_disparo;
DROP POLICY IF EXISTS "Users can update own campanhas_disparo" ON campanhas_disparo;
DROP POLICY IF EXISTS "Users can delete own campanhas_disparo" ON campanhas_disparo;

DROP POLICY IF EXISTS "Users can view own conversas" ON conversas;
DROP POLICY IF EXISTS "Users can insert conversas" ON conversas;
DROP POLICY IF EXISTS "Users can update own conversas" ON conversas;
DROP POLICY IF EXISTS "Users can delete own conversas" ON conversas;

DROP POLICY IF EXISTS "Users can view own frases_whatsapp" ON frases_whatsapp;
DROP POLICY IF EXISTS "Users can insert frases_whatsapp" ON frases_whatsapp;
DROP POLICY IF EXISTS "Users can update own frases_whatsapp" ON frases_whatsapp;
DROP POLICY IF EXISTS "Users can delete own frases_whatsapp" ON frases_whatsapp;

-- Reabilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas_disparo ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE frases_whatsapp ENABLE ROW LEVEL SECURITY;

-- Criar políticas simplificadas para empresas
CREATE POLICY "empresas_select_policy" ON empresas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "empresas_insert_policy" ON empresas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "empresas_update_policy" ON empresas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "empresas_delete_policy" ON empresas
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas simplificadas para fluxos
CREATE POLICY "fluxos_select_policy" ON fluxos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "fluxos_insert_policy" ON fluxos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "fluxos_update_policy" ON fluxos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "fluxos_delete_policy" ON fluxos
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas simplificadas para message_templates
CREATE POLICY "message_templates_select_policy" ON message_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "message_templates_insert_policy" ON message_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "message_templates_update_policy" ON message_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "message_templates_delete_policy" ON message_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas simplificadas para campanhas_disparo
CREATE POLICY "campanhas_disparo_select_policy" ON campanhas_disparo
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "campanhas_disparo_insert_policy" ON campanhas_disparo
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campanhas_disparo_update_policy" ON campanhas_disparo
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "campanhas_disparo_delete_policy" ON campanhas_disparo
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas simplificadas para conversas
CREATE POLICY "conversas_select_policy" ON conversas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "conversas_insert_policy" ON conversas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "conversas_update_policy" ON conversas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "conversas_delete_policy" ON conversas
  FOR DELETE USING (auth.uid() = user_id);

-- Criar políticas simplificadas para frases_whatsapp
CREATE POLICY "frases_whatsapp_select_policy" ON frases_whatsapp
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "frases_whatsapp_insert_policy" ON frases_whatsapp
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "frases_whatsapp_update_policy" ON frases_whatsapp
  FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "frases_whatsapp_delete_policy" ON frases_whatsapp
  FOR DELETE USING (auth.uid() = usuario_id);

-- Comentários para documentação
COMMENT ON TABLE empresas IS 'Tabela de empresas - Políticas RLS simplificadas';
COMMENT ON TABLE fluxos IS 'Tabela de fluxos - Políticas RLS simplificadas';
COMMENT ON TABLE message_templates IS 'Tabela de templates - Políticas RLS simplificadas';
COMMENT ON TABLE campanhas_disparo IS 'Tabela de campanhas - Políticas RLS simplificadas';
COMMENT ON TABLE conversas IS 'Tabela de conversas - Políticas RLS simplificadas';

-- Log das correções
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS simplificadas criadas com sucesso';
  RAISE NOTICE 'Agora as inserções devem funcionar corretamente';
END $$; 