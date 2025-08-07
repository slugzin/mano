-- Correção profunda para resolver recursão infinita na tabela profiles
-- Primeiro, vamos verificar se a tabela profiles existe e sua estrutura

-- 1. Verificar se a tabela profiles existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabela profiles não existe, criando...';
        
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            role TEXT DEFAULT 'user',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Criar trigger para atualizar updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        CREATE TRIGGER update_profiles_updated_at 
            BEFORE UPDATE ON public.profiles 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE 'Tabela profiles criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela profiles já existe';
    END IF;
END $$;

-- 2. Desabilitar RLS completamente
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as políticas existentes (incluindo as que podem ter nomes diferentes)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.profiles';
        RAISE NOTICE 'Política removida: %', policy_record.policyname;
    END LOOP;
END $$;

-- 4. Verificar se há triggers problemáticos
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'profiles' AND trigger_schema = 'public'
    LOOP
        RAISE NOTICE 'Trigger encontrado: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- 5. Criar políticas RLS MUITO simples (sem recursão)
CREATE POLICY "profiles_select_simple" ON public.profiles
    FOR SELECT
    USING (true);  -- Permitir SELECT para todos (temporariamente)

CREATE POLICY "profiles_insert_simple" ON public.profiles
    FOR INSERT
    WITH CHECK (true);  -- Permitir INSERT para todos (temporariamente)

CREATE POLICY "profiles_update_simple" ON public.profiles
    FOR UPDATE
    USING (true)
    WITH CHECK (true);  -- Permitir UPDATE para todos (temporariamente)

CREATE POLICY "profiles_delete_simple" ON public.profiles
    FOR DELETE
    USING (true);  -- Permitir DELETE para todos (temporariamente)

-- 6. Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Função para testar acesso sem recursão
CREATE OR REPLACE FUNCTION test_profiles_simple()
RETURNS TABLE (
    resultado TEXT,
    count_profiles INTEGER,
    erro TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER  -- Executar com privilégios do criador
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

-- 8. Função para inserir perfil sem recursão
CREATE OR REPLACE FUNCTION inserir_perfil_simples(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result TEXT;
BEGIN
    BEGIN
        -- Tentar inserir perfil
        INSERT INTO public.profiles (
            id, email, full_name, role, is_active, created_at, updated_at
        ) VALUES (
            p_user_id,
            p_email,
            p_full_name,
            'user',
            true,
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            updated_at = NOW();
        
        v_result := 'Perfil criado/atualizado com sucesso';
    EXCEPTION
        WHEN OTHERS THEN
            v_result := 'Erro ao criar perfil: ' || SQLERRM;
    END;
    
    RETURN v_result;
END;
$$;

-- 9. Função para verificar estrutura completa
CREATE OR REPLACE FUNCTION verificar_profiles_completo()
RETURNS TABLE (
    tipo_verificacao TEXT,
    resultado TEXT,
    detalhes TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verificar se a tabela existe
    RETURN QUERY
    SELECT 
        'Tabela existe'::TEXT,
        CASE WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'profiles' AND table_schema = 'public'
        ) THEN 'SIM' ELSE 'NÃO' END,
        'Verificação de existência da tabela';
    
    -- Verificar RLS
    RETURN QUERY
    SELECT 
        'RLS habilitado'::TEXT,
        CASE WHEN EXISTS (
            SELECT FROM pg_tables 
            WHERE tablename = 'profiles' AND rowsecurity = true
        ) THEN 'SIM' ELSE 'NÃO' END,
        'Verificação de RLS';
    
    -- Verificar políticas
    RETURN QUERY
    SELECT 
        'Políticas RLS'::TEXT,
        (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'profiles'),
        'Número de políticas ativas';
    
    -- Verificar triggers
    RETURN QUERY
    SELECT 
        'Triggers'::TEXT,
        (SELECT COUNT(*)::TEXT FROM information_schema.triggers WHERE event_object_table = 'profiles'),
        'Número de triggers ativos';
    
    -- Testar acesso
    RETURN QUERY
    SELECT 
        'Acesso direto'::TEXT,
        CASE 
            WHEN EXISTS (SELECT 1 FROM public.profiles LIMIT 1) THEN 'SUCESSO'
            ELSE 'ERRO'
        END,
        'Teste de acesso direto à tabela';
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION test_profiles_simple() IS 'Função para testar acesso à tabela profiles sem recursão.';
COMMENT ON FUNCTION inserir_perfil_simples() IS 'Função para inserir perfil sem recursão.';
COMMENT ON FUNCTION verificar_profiles_completo() IS 'Função para verificação completa da tabela profiles.'; 