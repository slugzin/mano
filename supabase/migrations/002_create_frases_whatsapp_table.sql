-- Criar tabela para frases de WhatsApp (fluxos de mensagens)
CREATE TABLE IF NOT EXISTS "public"."frases_whatsapp" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "fase" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criada_em" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "delay_seconds" INTEGER DEFAULT 0,
    "delay_min_seconds" INTEGER DEFAULT 30,
    "delay_max_seconds" INTEGER DEFAULT 60,
    "formato" TEXT DEFAULT 'text',
    "conteudo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "aguardar_resposta" BOOLEAN DEFAULT false,
    "ativo" BOOLEAN DEFAULT true,
    "usuario_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_frases_whatsapp_fase ON "public"."frases_whatsapp" ("fase");
CREATE INDEX IF NOT EXISTS idx_frases_whatsapp_tipo ON "public"."frases_whatsapp" ("tipo");
CREATE INDEX IF NOT EXISTS idx_frases_whatsapp_ordem ON "public"."frases_whatsapp" ("ordem");
CREATE INDEX IF NOT EXISTS idx_frases_whatsapp_usuario_id ON "public"."frases_whatsapp" ("usuario_id");

-- RLS (Row Level Security)
ALTER TABLE "public"."frases_whatsapp" ENABLE ROW LEVEL SECURITY;

-- Política para usuários autenticados poderem ver apenas seus próprios dados
CREATE POLICY "Users can view own frases_whatsapp" ON "public"."frases_whatsapp"
    FOR SELECT USING (auth.uid() = usuario_id);

-- Política para usuários autenticados poderem inserir seus próprios dados
CREATE POLICY "Users can insert own frases_whatsapp" ON "public"."frases_whatsapp"
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Política para usuários autenticados poderem atualizar seus próprios dados
CREATE POLICY "Users can update own frases_whatsapp" ON "public"."frases_whatsapp"
    FOR UPDATE USING (auth.uid() = usuario_id);

-- Política para usuários autenticados poderem deletar seus próprios dados
CREATE POLICY "Users can delete own frases_whatsapp" ON "public"."frases_whatsapp"
    FOR DELETE USING (auth.uid() = usuario_id);

-- Comentários para documentação
COMMENT ON TABLE "public"."frases_whatsapp" IS 'Tabela para armazenar frases e fluxos de mensagens do WhatsApp';
COMMENT ON COLUMN "public"."frases_whatsapp"."fase" IS 'Fase do fluxo (fase_1, fase_2, etc.)';
COMMENT ON COLUMN "public"."frases_whatsapp"."tipo" IS 'Tipo da frase (frase1, frase2, etc.)';
COMMENT ON COLUMN "public"."frases_whatsapp"."texto" IS 'Conteúdo da mensagem';
COMMENT ON COLUMN "public"."frases_whatsapp"."delay_seconds" IS 'Delay fixo em segundos';
COMMENT ON COLUMN "public"."frases_whatsapp"."delay_min_seconds" IS 'Delay mínimo em segundos';
COMMENT ON COLUMN "public"."frases_whatsapp"."delay_max_seconds" IS 'Delay máximo em segundos';
COMMENT ON COLUMN "public"."frases_whatsapp"."formato" IS 'Formato da mensagem (text, image, audio, etc.)';
COMMENT ON COLUMN "public"."frases_whatsapp"."conteudo" IS 'Conteúdo da mensagem';
COMMENT ON COLUMN "public"."frases_whatsapp"."ordem" IS 'Ordem da mensagem no fluxo';
COMMENT ON COLUMN "public"."frases_whatsapp"."aguardar_resposta" IS 'Se deve aguardar resposta do cliente'; 