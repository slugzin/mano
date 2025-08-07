-- Verificar e corrigir estrutura da tabela disparos_agendados
-- Garantir que todas as colunas necessárias existem

-- Adicionar colunas se não existirem
DO $$
BEGIN
    -- Verificar se a coluna user_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disparos_agendados' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.disparos_agendados ADD COLUMN user_id UUID;
    END IF;

    -- Verificar se a coluna created_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disparos_agendados' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.disparos_agendados ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Verificar se a coluna updated_at existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disparos_agendados' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.disparos_agendados ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Verificar se a coluna ordem existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disparos_agendados' 
        AND column_name = 'ordem'
    ) THEN
        ALTER TABLE public.disparos_agendados ADD COLUMN ordem INTEGER DEFAULT 1;
    END IF;

    -- Verificar se a coluna fase existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disparos_agendados' 
        AND column_name = 'fase'
    ) THEN
        ALTER TABLE public.disparos_agendados ADD COLUMN fase TEXT DEFAULT 'fase_1';
    END IF;

    -- Verificar se a coluna criado_em existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'disparos_agendados' 
        AND column_name = 'criado_em'
    ) THEN
        ALTER TABLE public.disparos_agendados ADD COLUMN criado_em TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_disparos_agendados_status 
ON public.disparos_agendados (status);

CREATE INDEX IF NOT EXISTS idx_disparos_agendados_agendado_para 
ON public.disparos_agendados (agendado_para);

CREATE INDEX IF NOT EXISTS idx_disparos_agendados_user_id 
ON public.disparos_agendados (user_id);

CREATE INDEX IF NOT EXISTS idx_disparos_agendados_conexao_id 
ON public.disparos_agendados (conexao_id);

-- Criar índice composto para a consulta principal
CREATE INDEX IF NOT EXISTS idx_disparos_agendados_consulta_principal 
ON public.disparos_agendados (status, agendado_para, fase, ordem) 
WHERE status = 'pendente';

-- Atualizar estatísticas da tabela
ANALYZE public.disparos_agendados;

-- Função para verificar a estrutura da tabela
CREATE OR REPLACE FUNCTION verificar_estrutura_disparos_agendados()
RETURNS TABLE (
    coluna_nome TEXT,
    tipo_dados TEXT,
    eh_nullable TEXT,
    valor_padrao TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        COALESCE(c.column_default, 'NULL')::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = 'disparos_agendados'
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION verificar_estrutura_disparos_agendados() IS 'Função para verificar a estrutura atual da tabela disparos_agendados.'; 