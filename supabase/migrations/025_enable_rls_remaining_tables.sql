-- Habilitar RLS nas tabelas restantes que ainda estão "Unrestricted"
ALTER TABLE campanhas_disparo ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela campanhas_disparo
CREATE POLICY "Users can view campanhas_disparo" ON campanhas_disparo
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert campanhas_disparo" ON campanhas_disparo
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update campanhas_disparo" ON campanhas_disparo
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete campanhas_disparo" ON campanhas_disparo
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para tabela message_templates
CREATE POLICY "Users can view message_templates" ON message_templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert message_templates" ON message_templates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update message_templates" ON message_templates
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete message_templates" ON message_templates
  FOR DELETE USING (auth.role() = 'authenticated');

-- Comentários explicativos
COMMENT ON TABLE campanhas_disparo IS 'Tabela de disparos de campanhas - RLS habilitado';
COMMENT ON TABLE message_templates IS 'Tabela de templates de mensagens - RLS habilitado'; 