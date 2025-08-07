-- Adicionar coluna tipo_campanha na tabela campanhas_disparo
ALTER TABLE "public"."campanhas_disparo" 
ADD COLUMN IF NOT EXISTS "tipo_campanha" TEXT DEFAULT 'template';

-- Comentário para documentação
COMMENT ON COLUMN "public"."campanhas_disparo"."tipo_campanha" IS 'Tipo da campanha: template (mensagem única) ou fluxo (múltiplas mensagens)'; 