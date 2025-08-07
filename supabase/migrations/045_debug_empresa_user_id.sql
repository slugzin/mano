-- Debug para verificar empresa e disparos
-- Função para verificar empresa específica
CREATE OR REPLACE FUNCTION debug_empresa(p_empresa_id INTEGER DEFAULT 571)
RETURNS TABLE (
    tipo_verificacao TEXT,
    resultado TEXT,
    detalhes TEXT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    v_empresa_count INTEGER;
    v_disparos_count INTEGER;
    v_disparos_processando INTEGER;
    v_disparos_pendentes INTEGER;
    v_disparos_enviados INTEGER;
BEGIN
    -- Verificar se a empresa existe
    SELECT COUNT(*) INTO v_empresa_count
    FROM empresas 
    WHERE id = p_empresa_id;
    
    RETURN QUERY
    SELECT 
        'Empresa existe'::TEXT,
        CASE WHEN v_empresa_count > 0 THEN 'SIM' ELSE 'NÃO' END,
        'Verificação de existência da empresa ID: ' || p_empresa_id::TEXT;
    
    -- Verificar se a empresa pertence ao user_id correto
    SELECT COUNT(*) INTO v_empresa_count
    FROM empresas 
    WHERE id = p_empresa_id
      AND user_id = v_user_id;
    
    RETURN QUERY
    SELECT 
        'Empresa pertence ao user_id'::TEXT,
        CASE WHEN v_empresa_count > 0 THEN 'SIM' ELSE 'NÃO' END,
        'Verificação se empresa pertence ao user_id: ' || v_user_id::TEXT;
    
    -- Verificar disparos da empresa
    SELECT COUNT(*) INTO v_disparos_count
    FROM disparos_agendados 
    WHERE empresa_id = p_empresa_id
      AND user_id = v_user_id;
    
    RETURN QUERY
    SELECT 
        'Total disparos da empresa'::TEXT,
        v_disparos_count::TEXT,
        'Disparos agendados para empresa ID: ' || p_empresa_id::TEXT;
    
    -- Verificar disparos processando
    SELECT COUNT(*) INTO v_disparos_processando
    FROM disparos_agendados 
    WHERE empresa_id = p_empresa_id
      AND status = 'processando'
      AND user_id = v_user_id;
    
    RETURN QUERY
    SELECT 
        'Disparos processando'::TEXT,
        v_disparos_processando::TEXT,
        'Disparos com status processando para empresa ID: ' || p_empresa_id::TEXT;
    
    -- Verificar disparos pendentes
    SELECT COUNT(*) INTO v_disparos_pendentes
    FROM disparos_agendados 
    WHERE empresa_id = p_empresa_id
      AND status = 'pendente'
      AND user_id = v_user_id;
    
    RETURN QUERY
    SELECT 
        'Disparos pendentes'::TEXT,
        v_disparos_pendentes::TEXT,
        'Disparos com status pendente para empresa ID: ' || p_empresa_id::TEXT;
    
    -- Verificar disparos enviados
    SELECT COUNT(*) INTO v_disparos_enviados
    FROM disparos_agendados 
    WHERE empresa_id = p_empresa_id
      AND status = 'enviado'
      AND user_id = v_user_id;
    
    RETURN QUERY
    SELECT 
        'Disparos enviados'::TEXT,
        v_disparos_enviados::TEXT,
        'Disparos com status enviado para empresa ID: ' || p_empresa_id::TEXT;
END;
$$;

-- Função para listar todos os disparos de uma empresa
CREATE OR REPLACE FUNCTION listar_disparos_empresa(p_empresa_id INTEGER DEFAULT 571)
RETURNS TABLE (
    id_disparo INTEGER,
    empresa_id_disparo INTEGER,
    empresa_nome_disparo TEXT,
    status_disparo TEXT,
    agendado_para_disparo TIMESTAMP,
    criado_em_disparo TIMESTAMP,
    conexao_id_disparo TEXT,
    user_id_disparo UUID
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
BEGIN
    RETURN QUERY
    SELECT 
        da.id,
        da.empresa_id,
        da.empresa_nome,
        da.status,
        da.agendado_para,
        da.criado_em,
        da.conexao_id,
        da.user_id
    FROM disparos_agendados da
    WHERE da.empresa_id = p_empresa_id
      AND da.user_id = v_user_id
    ORDER BY da.criado_em DESC;
END;
$$;

-- Função para criar disparo de teste para empresa
CREATE OR REPLACE FUNCTION criar_disparo_teste_empresa(p_empresa_id INTEGER DEFAULT 571)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := 'c4a948a1-a1cc-42ed-902c-a70c4959d3b7'::UUID;
    v_empresa_nome TEXT;
    v_disparo_id INTEGER;
BEGIN
    -- Verificar se a empresa existe
    SELECT empresa_nome INTO v_empresa_nome
    FROM empresas 
    WHERE id = p_empresa_id
      AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RETURN 'Erro: Empresa não encontrada com ID ' || p_empresa_id::TEXT || ' para user_id ' || v_user_id::TEXT;
    END IF;
    
    -- Criar disparo de teste
    INSERT INTO disparos_agendados (
        empresa_id,
        empresa_nome,
        empresa_telefone,
        empresa_website,
        empresa_endereco,
        mensagem,
        tipo_midia,
        midia_url,
        status,
        agendado_para,
        conexao_id,
        ordem,
        fase,
        criado_em,
        user_id
    ) VALUES (
        p_empresa_id,
        v_empresa_nome,
        '5515981475767@s.whatsapp.net',
        'https://www.casadaspedrasbrasileiras.com.br/',
        'Rodovia Raposo Tavares Km 99, S/N - lj 163 - Vila Artura, Sorocaba - SP, 18023-000',
        'Teste de disparo automático',
        'nenhum',
        NULL,
        'processando',
        NOW(),
        'Teste Conexão',
        1,
        'fase_1',
        NOW(),
        v_user_id
    ) RETURNING id INTO v_disparo_id;
    
    RETURN 'Disparo de teste criado com ID: ' || v_disparo_id::TEXT || ' para empresa: ' || v_empresa_nome;
END;
$$;

-- Comentários explicativos
COMMENT ON FUNCTION debug_empresa(INTEGER) IS 'Função para debug de empresa e seus disparos.';
COMMENT ON FUNCTION listar_disparos_empresa(INTEGER) IS 'Função para listar todos os disparos de uma empresa.';
COMMENT ON FUNCTION criar_disparo_teste_empresa(INTEGER) IS 'Função para criar disparo de teste para uma empresa.'; 