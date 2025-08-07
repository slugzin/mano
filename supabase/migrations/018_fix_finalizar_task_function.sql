-- Corrigir função finalizar_task para usar empresa_nome em vez de titulo
CREATE OR REPLACE FUNCTION finalizar_task(p_empresa_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_empresa_atual RECORD;
    v_disparo_info RECORD;
    v_resultado JSON;
    v_campanha_id UUID;
BEGIN
    -- Verificar se a empresa existe
    SELECT id, empresa_nome, status INTO v_empresa_atual
    FROM empresas 
    WHERE id = p_empresa_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Empresa não encontrada com ID: ' || p_empresa_id::TEXT,
            'empresa_id', p_empresa_id
        );
    END IF;

    -- Buscar informações do disparo processando
    SELECT id, agendado_para INTO v_disparo_info
    FROM disparos_agendados 
    WHERE empresa_id = p_empresa_id 
      AND status = 'processando'
    ORDER BY agendado_para DESC 
    LIMIT 1;

    -- ATUALIZAR STATUS DA EMPRESA (a_contatar → contato_realizado)
    UPDATE empresas 
    SET 
        status = CASE 
            WHEN status = 'a_contatar' THEN 'contato_realizado'
            ELSE status
        END,
        atualizado_em = NOW()
    WHERE id = p_empresa_id;

    -- ATUALIZAR HISTÓRICO NO DISPAROS_AGENDADOS (processando → enviado)
    UPDATE disparos_agendados 
    SET 
        status = 'enviado',
        updated_at = NOW()
    WHERE empresa_id = p_empresa_id
      AND status = 'processando';

    -- Buscar campanha_id através da tabela campanhas_empresas
    SELECT campanha_id INTO v_campanha_id
    FROM campanhas_empresas 
    WHERE empresa_id = p_empresa_id::TEXT
      AND status = 'pendente'
    ORDER BY criado_em DESC
    LIMIT 1;

    -- ATUALIZAR HISTÓRICO NA CAMPANHA (se encontrou campanha)
    IF v_campanha_id IS NOT NULL THEN
        UPDATE campanhas_empresas 
        SET 
            status = 'enviado',
            enviado_em = NOW()
        WHERE campanha_id = v_campanha_id 
          AND empresa_id = p_empresa_id::TEXT;

        -- Atualizar totais da campanha
        UPDATE campanhas_disparo 
        SET 
            total_enviados = (
                SELECT COUNT(*) 
                FROM campanhas_empresas 
                WHERE campanha_id = v_campanha_id AND status = 'enviado'
            ),
            total_erros = (
                SELECT COUNT(*) 
                FROM campanhas_empresas 
                WHERE campanha_id = v_campanha_id AND status = 'erro'
            ),
            status = CASE 
                WHEN (
                    SELECT COUNT(*) 
                    FROM campanhas_empresas 
                    WHERE campanha_id = v_campanha_id AND status IN ('enviado', 'erro')
                ) = total_empresas THEN 'concluida'
                ELSE status
            END,
            atualizado_em = NOW()
        WHERE id = v_campanha_id;
    END IF;

    -- Retornar resultado
    v_resultado := json_build_object(
        'success', true,
        'empresa_id', p_empresa_id,
        'empresa_nome', v_empresa_atual.empresa_nome,
        'status_anterior', v_empresa_atual.status,
        'status_novo', CASE WHEN v_empresa_atual.status = 'a_contatar' THEN 'contato_realizado' ELSE v_empresa_atual.status END,
        'disparo_status', 'enviado',
        'campanha_id', v_campanha_id,
        'disparo_encontrado', v_disparo_info.id IS NOT NULL,
        'timestamp', NOW()
    );

    RETURN v_resultado;

EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    RETURN json_build_object(
        'success', false,
        'error', 'Erro interno: ' || SQLERRM,
        'empresa_id', p_empresa_id,
        'timestamp', NOW()
    );
END;
$$;

-- Comentário explicativo da função
COMMENT ON FUNCTION finalizar_task(INTEGER) IS 'Função RPC para finalizar uma task de disparo, atualizando status da empresa e disparo. Corrigida para usar empresa_nome.'; 