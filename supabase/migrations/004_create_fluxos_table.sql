-- Criar tabela para fluxos (pastas que contêm fases)
CREATE TABLE IF NOT EXISTS "public"."fluxos" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "ativo" BOOLEAN DEFAULT true
);

-- Adicionar coluna fluxo_id na tabela frases_whatsapp
ALTER TABLE "public"."frases_whatsapp" 
ADD COLUMN IF NOT EXISTS "fluxo_id" UUID REFERENCES "public"."fluxos"("id") ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_fluxos_nome ON "public"."fluxos" ("nome");
CREATE INDEX IF NOT EXISTS idx_frases_whatsapp_fluxo_id ON "public"."frases_whatsapp" ("fluxo_id");

-- RLS (Row Level Security) - Desabilitado para funcionar sem auth
ALTER TABLE "public"."fluxos" DISABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON TABLE "public"."fluxos" IS 'Tabela para armazenar fluxos de mensagens (pastas)';
COMMENT ON COLUMN "public"."fluxos"."nome" IS 'Nome do fluxo (ex: Fluxo Cílios)';
COMMENT ON COLUMN "public"."fluxos"."descricao" IS 'Descrição do fluxo';
COMMENT ON COLUMN "public"."frases_whatsapp"."fluxo_id" IS 'Referência ao fluxo pai'; 