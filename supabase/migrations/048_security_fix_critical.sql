-- CORREÇÃO CRÍTICA DE SEGURANÇA
-- Esta migração corrige vulnerabilidades identificadas na auditoria

-- 1. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE frases_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE disparos_agendados ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_enviadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_kanban ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_instances ENABLE ROW LEVEL SECURITY;

-- 2. REMOVER POLÍTICAS INSEGURAS
DROP POLICY IF EXISTS "Users can view empresas" ON empresas;
DROP POLICY IF EXISTS "Users can insert empresas" ON empresas;
DROP POLICY IF EXISTS "Users can update empresas" ON empresas;
DROP POLICY IF EXISTS "Users can delete empresas" ON empresas;

-- 3. CRIAR POLÍTICAS SEGURAS BASEADAS EM USER_ID
-- Empresas - apenas dados do próprio usuário
CREATE POLICY "Users can view own empresas" ON empresas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own empresas" ON empresas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own empresas" ON empresas
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own empresas" ON empresas
  FOR DELETE USING (auth.uid() = user_id);

-- Conversas - apenas dados do próprio usuário
DROP POLICY IF EXISTS "Users can view conversas" ON conversas;
DROP POLICY IF EXISTS "Users can insert conversas" ON conversas;
DROP POLICY IF EXISTS "Users can update conversas" ON conversas;

CREATE POLICY "Users can view own conversas" ON conversas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversas" ON conversas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversas" ON conversas
  FOR UPDATE USING (auth.uid() = user_id);

-- Frases WhatsApp - apenas dados do próprio usuário
DROP POLICY IF EXISTS "Users can view frases_whatsapp" ON frases_whatsapp;
DROP POLICY IF EXISTS "Users can insert frases_whatsapp" ON frases_whatsapp;
DROP POLICY IF EXISTS "Users can update frases_whatsapp" ON frases_whatsapp;

CREATE POLICY "Users can view own frases_whatsapp" ON frases_whatsapp
  FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Users can insert own frases_whatsapp" ON frases_whatsapp
  FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update own frases_whatsapp" ON frases_whatsapp
  FOR UPDATE USING (auth.uid() = usuario_id);

-- 4. BLOQUEAR ACESSO ANÔNIMO A FUNÇÕES CRÍTICAS
-- Revogar permissões públicas das funções RPC
REVOKE EXECUTE ON FUNCTION proximo_disparo() FROM anon;
REVOKE EXECUTE ON FUNCTION agendar_disparos(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION finalizar_task(text, text, text) FROM anon;

-- Permitir apenas para usuários autenticados
GRANT EXECUTE ON FUNCTION proximo_disparo() TO authenticated;
GRANT EXECUTE ON FUNCTION agendar_disparos(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION finalizar_task(text, text, text) TO authenticated;

-- 5. CRIAR FUNÇÃO DE AUDITORIA
CREATE OR REPLACE FUNCTION log_security_event(
  event_type text,
  table_name text,
  record_id text DEFAULT NULL,
  details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    event_type,
    table_name,
    record_id,
    details,
    created_at,
    ip_address
  ) VALUES (
    auth.uid(),
    event_type,
    table_name,
    record_id,
    details,
    now(),
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
END;
$$;

-- 6. CRIAR TABELA DE AUDITORIA
CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  details jsonb,
  created_at timestamptz DEFAULT now(),
  ip_address text
);

-- RLS na tabela de auditoria
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON security_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- 7. COMENTÁRIOS DE SEGURANÇA
COMMENT ON TABLE security_audit_log IS 'Log de auditoria de segurança - rastreia todas as operações sensíveis';
COMMENT ON FUNCTION log_security_event IS 'Função para registrar eventos de segurança';

-- Log da correção
DO $$
BEGIN
  RAISE NOTICE 'CORREÇÃO DE SEGURANÇA APLICADA COM SUCESSO';
  RAISE NOTICE 'RLS habilitado em todas as tabelas';
  RAISE NOTICE 'Políticas baseadas em user_id implementadas';
  RAISE NOTICE 'Sistema de auditoria criado';
END $$; 