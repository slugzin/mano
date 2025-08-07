-- Corrigir conflitos de funções removendo as existentes primeiro
DROP FUNCTION IF EXISTS verificar_estrutura_disparos_agendados();
DROP FUNCTION IF EXISTS debug_rls_disparos_agendados();
DROP FUNCTION IF EXISTS verificar_politicas_rls();
DROP FUNCTION IF EXISTS test_acesso_direto_tabela();
DROP FUNCTION IF EXISTS verificar_dados_disparos_agendados();
DROP FUNCTION IF EXISTS test_inserir_disparo();
DROP FUNCTION IF EXISTS verificar_jwt_claims();

-- Recriar função debug_rls_disparos_agendados
CREATE OR REPLACE FUNCTION debug_rls_disparos_agendados()
RETURNS TABLE (
    configuracao TEXT,
    valor TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 'RLS habilitado'::TEXT, 
           CASE WHEN EXISTS (
               SELECT 1 FROM pg_tables 
               WHERE tablename = 'disparos_agendados' 
                 AND rowsecurity = true
           ) THEN 'SIM' ELSE 'NÃO' END::TEXT
    UNION ALL
    SELECT 'Políticas RLS'::TEXT, 
           (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'disparos_agendados')
    UNION ALL
    SELECT 'Usuário atual'::TEXT, current_user::TEXT
    UNION ALL
    SELECT 'Schema atual'::TEXT, current_schema()::TEXT
    UNION ALL
    SELECT 'Total registros (sem RLS)'::TEXT, 
           (SELECT COUNT(*)::TEXT FROM public.disparos_agendados)
    UNION ALL
    SELECT 'Total registros (com RLS)'::TEXT, 
           (SELECT COUNT(*)::TEXT FROM public.disparos_agendados WHERE true)
    UNION ALL
    SELECT 'Registros pendentes (sem RLS)'::TEXT, 
           (SELECT COUNT(*)::TEXT FROM public.disparos_agendados WHERE status = 'pendente')
    UNION ALL
    SELECT 'Registros pendentes (com RLS)'::TEXT, 
           (SELECT COUNT(*)::TEXT FROM public.disparos_agendados WHERE status = 'pendente' AND true);
END;
$$;

-- Recriar função verificar_politicas_rls
CREATE OR REPLACE FUNCTION verificar_politicas_rls()
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
    WHERE p.tablename = 'disparos_agendados'
    ORDER BY p.policyname;
END;
$$;

-- Recriar função test_acesso_direto_tabela
CREATE OR REPLACE FUNCTION test_acesso_direto_tabela()
RETURNS TABLE (
    teste TEXT,
    resultado TEXT,
    count_registros INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
    v_count_pendente INTEGER;
    v_count_user_id INTEGER;
    v_user_id TEXT;
BEGIN
    -- Pegar user_id atual
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- Teste 1: Contar todos os registros
    SELECT COUNT(*) INTO v_count FROM public.disparos_agendados;
    
    -- Teste 2: Contar registros pendentes
    SELECT COUNT(*) INTO v_count_pendente FROM public.disparos_agendados WHERE status = 'pendente';
    
    -- Teste 3: Contar registros com user_id específico
    SELECT COUNT(*) INTO v_count_user_id FROM public.disparos_agendados WHERE user_id::TEXT = v_user_id;
    
    RETURN QUERY
    SELECT 'Total registros'::TEXT, 'OK'::TEXT, v_count
    UNION ALL
    SELECT 'Registros pendentes'::TEXT, 'OK'::TEXT, v_count_pendente
    UNION ALL
    SELECT 'Registros com user_id'::TEXT, v_user_id, v_count_user_id;
END;
$$;

-- Recriar função verificar_estrutura_disparos_agendados
CREATE OR REPLACE FUNCTION verificar_estrutura_disparos_agendados()
RETURNS TABLE (
    coluna_nome TEXT,
    tipo_dados TEXT,
    eh_nullable TEXT,
    valor_padrao TEXT,
    posicao INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::TEXT,
        c.data_type::TEXT,
        c.is_nullable::TEXT,
        COALESCE(c.column_default, 'NULL')::TEXT,
        c.ordinal_position
    FROM information_schema.columns c
    WHERE c.table_name = 'disparos_agendados'
      AND c.table_schema = 'public'
    ORDER BY c.ordinal_position;
END;
$$;

-- Recriar função verificar_dados_disparos_agendados
CREATE OR REPLACE FUNCTION verificar_dados_disparos_agendados()
RETURNS TABLE (
    id TEXT,
    empresa_nome TEXT,
    status_disparo TEXT,
    agendado_para_disparo TEXT,
    user_id_disparo TEXT,
    criado_em_disparo TEXT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id::TEXT,
        t.empresa_nome,
        t.status as status_disparo,
        t.agendado_para::TEXT as agendado_para_disparo,
        t.user_id::TEXT as user_id_disparo,
        t.criado_em::TEXT as criado_em_disparo
    FROM public.disparos_agendados t
    ORDER BY t.criado_em DESC
    LIMIT 10;
END;
$$;

-- Recriar função test_inserir_disparo
CREATE OR REPLACE FUNCTION test_inserir_disparo()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_id TEXT;
    v_user_id TEXT;
BEGIN
    -- Pegar user_id atual
    v_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
    
    -- Se não conseguir pegar do JWT, usar um valor padrão
    IF v_user_id IS NULL THEN
        v_user_id := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7';
    END IF;
    
    -- Inserir disparo de teste
    INSERT INTO public.disparos_agendados (
        id, empresa_id, empresa_nome, empresa_telefone, empresa_website, 
        empresa_endereco, mensagem, tipo_midia, midia_url, status, 
        agendado_para, criado_em, conexao_id, ordem, fase, user_id
    ) VALUES (
        'TESTE_RLS_' || EXTRACT(EPOCH FROM NOW())::TEXT,
        997,
        'Empresa Teste RLS',
        '5511777777777@s.whatsapp.net',
        'https://teste-rls.com',
        'Endereço Teste RLS',
        'Mensagem de teste RLS',
        'nenhum',
        NULL,
        'pendente',
        NOW()::TIMESTAMP,
        NOW()::TIMESTAMP,
        'Teste Conexão RLS',
        1,
        'fase_1',
        v_user_id::UUID
    ) RETURNING id INTO v_id;
    
    RETURN 'Disparo de teste RLS criado com ID: ' || v_id || ' e user_id: ' || v_user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Erro ao inserir disparo: ' || SQLERRM;
END;
$$;

-- Recriar função verificar_jwt_claims
CREATE OR REPLACE FUNCTION verificar_jwt_claims()
RETURNS TABLE (
    claim_nome TEXT,
    valor TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_jwt_claims JSON;
    v_sub TEXT;
    v_email TEXT;
    v_role TEXT;
BEGIN
    -- Tentar pegar claims do JWT
    BEGIN
        v_jwt_claims := current_setting('request.jwt.claims', true)::json;
        v_sub := v_jwt_claims->>'sub';
        v_email := v_jwt_claims->>'email';
        v_role := v_jwt_claims->>'role';
    EXCEPTION
        WHEN OTHERS THEN
            v_jwt_claims := '{}'::JSON;
            v_sub := 'ERRO: ' || SQLERRM;
            v_email := 'ERRO: ' || SQLERRM;
            v_role := 'ERRO: ' || SQLERRM;
    END;
    
    RETURN QUERY
    SELECT 'JWT Claims'::TEXT, v_jwt_claims::TEXT
    UNION ALL
    SELECT 'Subject (sub)'::TEXT, COALESCE(v_sub, 'NULL')
    UNION ALL
    SELECT 'Email'::TEXT, COALESCE(v_email, 'NULL')
    UNION ALL
    SELECT 'Role'::TEXT, COALESCE(v_role, 'NULL');
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION debug_rls_disparos_agendados() IS 'Função para diagnosticar problemas de RLS na tabela disparos_agendados.';
COMMENT ON FUNCTION verificar_politicas_rls() IS 'Função para verificar políticas RLS específicas.';
COMMENT ON FUNCTION test_acesso_direto_tabela() IS 'Função para testar acesso direto à tabela.';
COMMENT ON FUNCTION verificar_estrutura_disparos_agendados() IS 'Função para verificar estrutura da tabela disparos_agendados.';
COMMENT ON FUNCTION verificar_dados_disparos_agendados() IS 'Função para verificar dados da tabela (sem RLS).';
COMMENT ON FUNCTION test_inserir_disparo() IS 'Função para testar inserção de dados.';
COMMENT ON FUNCTION verificar_jwt_claims() IS 'Função para verificar JWT e claims.'; 