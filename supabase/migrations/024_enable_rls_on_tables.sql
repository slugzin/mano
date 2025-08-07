-- Habilitar RLS em todas as tabelas importantes
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE frases_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE disparos_agendados ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_enviadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- Políticas para tabela empresas
CREATE POLICY "Users can view empresas" ON empresas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert empresas" ON empresas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update empresas" ON empresas
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete empresas" ON empresas
  FOR DELETE USING (auth.role() = 'authenticated');

-- Políticas para tabela conversas
CREATE POLICY "Users can view conversas" ON conversas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert conversas" ON conversas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update conversas" ON conversas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para tabela frases_whatsapp
CREATE POLICY "Users can view frases_whatsapp" ON frases_whatsapp
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert frases_whatsapp" ON frases_whatsapp
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update frases_whatsapp" ON frases_whatsapp
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para tabela fluxos
CREATE POLICY "Users can view fluxos" ON fluxos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert fluxos" ON fluxos
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update fluxos" ON fluxos
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para tabela disparos_agendados
CREATE POLICY "Users can view disparos_agendados" ON disparos_agendados
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert disparos_agendados" ON disparos_agendados
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update disparos_agendados" ON disparos_agendados
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para tabela campanhas
CREATE POLICY "Users can view campanhas" ON campanhas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert campanhas" ON campanhas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update campanhas" ON campanhas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para tabela mensagens_enviadas
CREATE POLICY "Users can view mensagens_enviadas" ON mensagens_enviadas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert mensagens_enviadas" ON mensagens_enviadas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update mensagens_enviadas" ON mensagens_enviadas
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para tabela movimentacoes_kanban
CREATE POLICY "Users can view movimentacoes_kanban" ON movimentacoes_kanban
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert movimentacoes_kanban" ON movimentacoes_kanban
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update movimentacoes_kanban" ON movimentacoes_kanban
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas para tabela whatsapp_instances
CREATE POLICY "Users can view whatsapp_instances" ON whatsapp_instances
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert whatsapp_instances" ON whatsapp_instances
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update whatsapp_instances" ON whatsapp_instances
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Comentários explicativos
COMMENT ON TABLE empresas IS 'Tabela de empresas capturadas - RLS habilitado';
COMMENT ON TABLE conversas IS 'Tabela de conversas do WhatsApp - RLS habilitado';
COMMENT ON TABLE frases_whatsapp IS 'Tabela de frases para WhatsApp - RLS habilitado';
COMMENT ON TABLE fluxos IS 'Tabela de fluxos de automação - RLS habilitado';
COMMENT ON TABLE disparos_agendados IS 'Tabela de disparos agendados - RLS habilitado';
COMMENT ON TABLE campanhas IS 'Tabela de campanhas - RLS habilitado';
COMMENT ON TABLE mensagens_enviadas IS 'Tabela de mensagens enviadas - RLS habilitado';
COMMENT ON TABLE movimentacoes_kanban IS 'Tabela de movimentações do Kanban - RLS habilitado';
COMMENT ON TABLE whatsapp_instances IS 'Tabela de instâncias WhatsApp - RLS habilitado'; 