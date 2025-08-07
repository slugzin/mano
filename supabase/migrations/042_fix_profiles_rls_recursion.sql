-- Corrigir recursão infinita nas políticas RLS da tabela profiles
-- Primeiro, vamos desabilitar RLS temporariamente para verificar a estrutura
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes da tabela profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;

-- Criar políticas RLS simples e seguras para profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);

-- Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Função para verificar se a tabela profiles existe e sua estrutura
CREATE OR REPLACE FUNCTION verificar_tabela_profiles()
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
    WHERE c.table_name = 'profiles'
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$;

-- Função para verificar políticas RLS da tabela profiles
CREATE OR REPLACE FUNCTION verificar_politicas_profiles()
RETURNS TABLE (
    politica_nome TEXT,
    comando TEXT,
    roles TEXT,
    usando TEXT,
    com TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.policyname::TEXT,
        p.cmd::TEXT,
        p.roles::TEXT,
        p.qual::TEXT,
        p.with_check::TEXT
    FROM pg_policies p
    WHERE p.tablename = 'profiles'
    ORDER BY p.policyname;
END;
$$;

-- Função para testar acesso à tabela profiles
CREATE OR REPLACE FUNCTION test_acesso_profiles()
RETURNS TABLE (
    resultado TEXT,
    count_profiles INTEGER,
    erro TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
    v_error TEXT;
BEGIN
    BEGIN
        -- Tentar contar registros na tabela profiles
        SELECT COUNT(*) INTO v_count FROM public.profiles;
        v_error := 'Nenhum erro';
    EXCEPTION
        WHEN OTHERS THEN
            v_count := 0;
            v_error := SQLERRM;
    END;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN v_error = 'Nenhum erro' THEN 'Sucesso'
            ELSE 'Erro'
        END,
        v_count,
        v_error;
END;
$$;

-- Função para inserir perfil de teste (se necessário)
CREATE OR REPLACE FUNCTION criar_perfil_teste()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_result TEXT;
BEGIN
    -- Usar o mesmo user_id que outras funções
    v_user_id := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    
    BEGIN
        -- Tentar inserir perfil de teste
        INSERT INTO public.profiles (
            id, email, full_name, role, is_active, created_at, updated_at
        ) VALUES (
            v_user_id,
            'teste@exemplo.com',
            'Usuário Teste',
            'user',
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            updated_at = NOW();
        
        v_result := 'Perfil criado/atualizado com sucesso';
    EXCEPTION
        WHEN OTHERS THEN
            v_result := 'Erro ao criar perfil: ' || SQLERRM;
    END;
    
    RETURN v_result;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION verificar_tabela_profiles() IS 'Função para verificar estrutura da tabela profiles.';
COMMENT ON FUNCTION verificar_politicas_profiles() IS 'Função para verificar políticas RLS da tabela profiles.';
COMMENT ON FUNCTION test_acesso_profiles() IS 'Função para testar acesso à tabela profiles.';
COMMENT ON FUNCTION criar_perfil_teste() IS 'Função para criar perfil de teste.'; 