-- Remover políticas RLS existentes que dependem de auth.uid()
DROP POLICY IF EXISTS "Users can view own frases_whatsapp" ON "public"."frases_whatsapp";
DROP POLICY IF EXISTS "Users can insert own frases_whatsapp" ON "public"."frases_whatsapp";
DROP POLICY IF EXISTS "Users can update own frases_whatsapp" ON "public"."frases_whatsapp";
DROP POLICY IF EXISTS "Users can delete own frases_whatsapp" ON "public"."frases_whatsapp";

-- Desabilitar RLS temporariamente para permitir operações
ALTER TABLE "public"."frases_whatsapp" DISABLE ROW LEVEL SECURITY;

-- Comentário explicativo
COMMENT ON TABLE "public"."frases_whatsapp" IS 'Tabela para armazenar frases e fluxos de mensagens do WhatsApp - RLS desabilitado para funcionar com sistema de auth customizado'; 