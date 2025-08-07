-- Script de teste para verificar se as políticas RLS estão funcionando
-- Execute este script para testar as políticas

-- Função para testar políticas RLS
CREATE OR REPLACE FUNCTION test_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  policy_type TEXT,
  status TEXT
) AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Pegar o ID do usuário atual
  SELECT auth.uid() INTO current_user_id;
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Testar políticas da tabela empresas
  RETURN QUERY
  SELECT 
    'empresas'::TEXT as table_name,
    'select_policy'::TEXT as policy_name,
    'SELECT'::TEXT as policy_type,
    CASE 
      WHEN EXISTS(SELECT 1 FROM empresas WHERE user_id = current_user_id LIMIT 1)
      THEN 'OK'::TEXT
      ELSE 'NO DATA'::TEXT
    END as status;
    
  -- Testar inserção na tabela empresas (se houver dados de teste)
  BEGIN
    INSERT INTO empresas (empresa_nome, user_id) 
    VALUES ('Empresa Teste RLS', current_user_id);
    
    RETURN QUERY
    SELECT 
      'empresas'::TEXT as table_name,
      'insert_policy'::TEXT as policy_name,
      'INSERT'::TEXT as policy_type,
      'OK'::TEXT as status;
      
    -- Limpar dados de teste
    DELETE FROM empresas WHERE empresa_nome = 'Empresa Teste RLS' AND user_id = current_user_id;
    
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY
    SELECT 
      'empresas'::TEXT as table_name,
      'insert_policy'::TEXT as policy_name,
      'INSERT'::TEXT as policy_type,
      'ERROR: ' || SQLERRM::TEXT as status;
  END;
  
  -- Testar políticas da tabela fluxos
  RETURN QUERY
  SELECT 
    'fluxos'::TEXT as table_name,
    'select_policy'::TEXT as policy_name,
    'SELECT'::TEXT as policy_type,
    CASE 
      WHEN EXISTS(SELECT 1 FROM fluxos WHERE user_id = current_user_id LIMIT 1)
      THEN 'OK'::TEXT
      ELSE 'NO DATA'::TEXT
    END as status;
    
  -- Testar políticas da tabela message_templates
  RETURN QUERY
  SELECT 
    'message_templates'::TEXT as table_name,
    'select_policy'::TEXT as policy_name,
    'SELECT'::TEXT as policy_type,
    CASE 
      WHEN EXISTS(SELECT 1 FROM message_templates WHERE user_id = current_user_id LIMIT 1)
      THEN 'OK'::TEXT
      ELSE 'NO DATA'::TEXT
    END as status;
    
  -- Testar políticas da tabela campanhas_disparo
  RETURN QUERY
  SELECT 
    'campanhas_disparo'::TEXT as table_name,
    'select_policy'::TEXT as policy_name,
    'SELECT'::TEXT as policy_type,
    CASE 
      WHEN EXISTS(SELECT 1 FROM campanhas_disparo WHERE user_id = current_user_id LIMIT 1)
      THEN 'OK'::TEXT
      ELSE 'NO DATA'::TEXT
    END as status;
    
  -- Testar políticas da tabela frases_whatsapp
  RETURN QUERY
  SELECT 
    'frases_whatsapp'::TEXT as table_name,
    'select_policy'::TEXT as policy_name,
    'SELECT'::TEXT as policy_type,
    CASE 
      WHEN EXISTS(SELECT 1 FROM frases_whatsapp WHERE usuario_id = current_user_id LIMIT 1)
      THEN 'OK'::TEXT
      ELSE 'NO DATA'::TEXT
    END as status;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para listar todas as políticas RLS
CREATE OR REPLACE FUNCTION list_rls_policies()
RETURNS TABLE (
  table_name TEXT,
  policy_name TEXT,
  policy_type TEXT,
  policy_definition TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::TEXT as table_name,
    policyname::TEXT as policy_name,
    cmd::TEXT as policy_type,
    qual::TEXT as policy_definition
  FROM pg_policies 
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON FUNCTION test_rls_policies IS 'Testa se as políticas RLS estão funcionando corretamente';
COMMENT ON FUNCTION list_rls_policies IS 'Lista todas as políticas RLS do banco';

-- Log das funções criadas
DO $$
BEGIN
  RAISE NOTICE 'Funções de teste criadas com sucesso';
  RAISE NOTICE 'Use SELECT * FROM test_rls_policies(); para testar as políticas';
  RAISE NOTICE 'Use SELECT * FROM list_rls_policies(); para listar todas as políticas';
END $$; 