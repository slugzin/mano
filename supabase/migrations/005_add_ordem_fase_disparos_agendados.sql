-- Adicionar colunas ordem e fase na tabela disparos_agendados
ALTER TABLE "public"."disparos_agendados" 
ADD COLUMN IF NOT EXISTS "ordem" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "fase" TEXT DEFAULT 'fase_1';

-- Criar índice para melhor performance em consultas por ordem e fase
CREATE INDEX IF NOT EXISTS idx_disparos_agendados_ordem_fase ON "public"."disparos_agendados" ("ordem", "fase");

-- Comentários para documentação
COMMENT ON COLUMN "public"."disparos_agendados"."ordem" IS 'Ordem da mensagem no fluxo (1, 2, 3, etc.)';
COMMENT ON COLUMN "public"."disparos_agendados"."fase" IS 'Fase da mensagem no fluxo (fase_1, fase_2, etc.)'; 