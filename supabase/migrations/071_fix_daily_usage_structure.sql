-- Corrigir a estrutura da tabela daily_usage e funções relacionadas
-- O erro indica que o campo "empresas_buscadas" não existe na tabela

-- Primeiro, vamos verificar se a tabela existe
DO $$
BEGIN
  -- Se a tabela não existir, criar
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'daily_usage') THEN
    CREATE TABLE daily_usage (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
      empresas_buscadas INTEGER NOT NULL DEFAULT 0,
      disparos_realizados INTEGER NOT NULL DEFAULT 0,
      conexoes_criadas INTEGER NOT NULL DEFAULT 0,
      templates_criados INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(user_id, usage_date)
    );
    
    -- Habilitar RLS
    ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Tabela daily_usage criada';
  ELSE
    RAISE NOTICE 'Tabela daily_usage já existe';
  END IF;
END $$;

-- Verificar e adicionar colunas que podem estar faltando
DO $$
BEGIN
  -- Adicionar empresas_buscadas se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'daily_usage' AND column_name = 'empresas_buscadas') THEN
    ALTER TABLE daily_usage ADD COLUMN empresas_buscadas INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Coluna empresas_buscadas adicionada';
  END IF;
  
  -- Adicionar disparos_realizados se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'daily_usage' AND column_name = 'disparos_realizados') THEN
    ALTER TABLE daily_usage ADD COLUMN disparos_realizados INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Coluna disparos_realizados adicionada';
  END IF;
  
  -- Adicionar conexoes_criadas se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'daily_usage' AND column_name = 'conexoes_criadas') THEN
    ALTER TABLE daily_usage ADD COLUMN conexoes_criadas INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Coluna conexoes_criadas adicionada';
  END IF;
  
  -- Adicionar templates_criados se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'daily_usage' AND column_name = 'templates_criados') THEN
    ALTER TABLE daily_usage ADD COLUMN templates_criados INTEGER NOT NULL DEFAULT 0;
    RAISE NOTICE 'Coluna templates_criados adicionada';
  END IF;
  
  -- Adicionar user_id se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'daily_usage' AND column_name = 'user_id') THEN
    ALTER TABLE daily_usage ADD COLUMN user_id UUID NOT NULL;
    RAISE NOTICE 'Coluna user_id adicionada';
  END IF;
  
  -- Adicionar usage_date se não existir
  IF NOT EXISTS (SELECT FROM information_schema.columns 
                 WHERE table_name = 'daily_usage' AND column_name = 'usage_date') THEN
    ALTER TABLE daily_usage ADD COLUMN usage_date DATE NOT NULL DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Coluna usage_date adicionada';
  END IF;
END $$;

-- Garantir que a tabela user_plans também existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_plans') THEN
    CREATE TABLE user_plans (
      id SERIAL PRIMARY KEY,
      user_id UUID NOT NULL,
      plan_type VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
      max_empresas INTEGER NOT NULL DEFAULT 30,
      max_disparos INTEGER NOT NULL DEFAULT 15,
      max_conexoes INTEGER NOT NULL DEFAULT 1,
      max_templates INTEGER NOT NULL DEFAULT 1,
      empresas_diarias INTEGER NOT NULL DEFAULT 15,
      disparos_diarios INTEGER NOT NULL DEFAULT 10,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      reset_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 day',
      UNIQUE(user_id)
    );
    
    ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
    RAISE NOTICE 'Tabela user_plans criada';
  END IF;
END $$;

-- Recriar as políticas de RLS
DROP POLICY IF EXISTS "Enable read access for own plan" ON user_plans;
DROP POLICY IF EXISTS "Enable insert for signup plan" ON user_plans;
DROP POLICY IF EXISTS "Enable update for own plan" ON user_plans;

CREATE POLICY "Enable read access for own plan" ON user_plans 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Enable insert for signup plan" ON user_plans 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for own plan" ON user_plans 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can view own usage" ON daily_usage;
DROP POLICY IF EXISTS "Allow insert for daily usage" ON daily_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON daily_usage;

CREATE POLICY "Users can view own usage" ON daily_usage 
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Allow insert for daily usage" ON daily_usage 
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own usage" ON daily_usage 
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Recriar função get_user_usage_stats com tratamento de erro melhorado
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_plan RECORD;
  daily_use RECORD;
  current_date DATE := CURRENT_DATE;
  result JSON;
BEGIN
  -- Verificar se o usuário foi fornecido
  IF p_user_id IS NULL THEN
    RETURN json_build_object('error', 'User ID is required');
  END IF;
  
  -- Buscar plano do usuário
  SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    BEGIN
      INSERT INTO user_plans (user_id) VALUES (p_user_id);
      SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('error', 'Failed to create user plan: ' || SQLERRM);
    END;
  END IF;
  
  -- Buscar uso diário
  SELECT * INTO daily_use FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = current_date;
  
  -- Se não encontrou uso diário, criar valores padrão
  IF NOT FOUND THEN
    BEGIN
      INSERT INTO daily_usage (user_id, usage_date, empresas_buscadas, disparos_realizados, conexoes_criadas, templates_criados)
      VALUES (p_user_id, current_date, 0, 0, 0, 0);
      
      SELECT * INTO daily_use FROM daily_usage 
      WHERE user_id = p_user_id AND usage_date = current_date;
    EXCEPTION
      WHEN OTHERS THEN
        -- Se falhar ao inserir, usar valores padrão
        daily_use := ROW(NULL, p_user_id, current_date, 0, 0, 0, 0, NOW(), NOW());
    END;
  END IF;
  
  -- Construir resultado
  result := json_build_object(
    'plan_type', user_plan.plan_type,
    'max_empresas', user_plan.max_empresas,
    'max_disparos', user_plan.max_disparos,
    'max_conexoes', user_plan.max_conexoes,
    'max_templates', user_plan.max_templates,
    'empresas_diarias', user_plan.empresas_diarias,
    'disparos_diarios', user_plan.disparos_diarios,
    'empresas_usadas', COALESCE(daily_use.empresas_buscadas, 0),
    'disparos_usados', COALESCE(daily_use.disparos_realizados, 0),
    'conexoes_usadas', COALESCE(daily_use.conexoes_criadas, 0),
    'templates_usados', COALESCE(daily_use.templates_criados, 0),
    'reset_date', user_plan.reset_date
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'Function error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar função check_user_limits com tratamento de erro melhorado
CREATE OR REPLACE FUNCTION check_user_limits(
  p_user_id UUID,
  p_action_type TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS JSON AS $$
DECLARE
  user_plan RECORD;
  daily_use RECORD;
  current_date DATE := CURRENT_DATE;
  result JSON;
BEGIN
  -- Verificar parâmetros
  IF p_user_id IS NULL THEN
    RETURN json_build_object('error', 'User ID is required');
  END IF;
  
  IF p_action_type IS NULL THEN
    RETURN json_build_object('error', 'Action type is required');
  END IF;
  
  -- Buscar plano do usuário
  SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    BEGIN
      INSERT INTO user_plans (user_id) VALUES (p_user_id);
      SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('error', 'Failed to create user plan');
    END;
  END IF;
  
  -- Buscar uso diário
  SELECT * INTO daily_use FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = current_date;
  
  IF NOT FOUND THEN
    BEGIN
      INSERT INTO daily_usage (user_id, usage_date, empresas_buscadas, disparos_realizados, conexoes_criadas, templates_criados)
      VALUES (p_user_id, current_date, 0, 0, 0, 0);
      
      SELECT * INTO daily_use FROM daily_usage 
      WHERE user_id = p_user_id AND usage_date = current_date;
    EXCEPTION
      WHEN OTHERS THEN
        -- Se falhar ao inserir, usar valores padrão
        daily_use := ROW(NULL, p_user_id, current_date, 0, 0, 0, 0, NOW(), NOW());
    END;
  END IF;
  
  -- Verificar limites baseado no tipo de ação
  CASE p_action_type
    WHEN 'buscar_empresas' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.empresas_buscadas, 0) + p_quantity) <= user_plan.max_empresas,
        'current_usage', COALESCE(daily_use.empresas_buscadas, 0),
        'limit', user_plan.max_empresas,
        'remaining', GREATEST(0, user_plan.max_empresas - COALESCE(daily_use.empresas_buscadas, 0))
      );
    WHEN 'fazer_disparo' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.disparos_realizados, 0) + p_quantity) <= user_plan.max_disparos,
        'current_usage', COALESCE(daily_use.disparos_realizados, 0),
        'limit', user_plan.max_disparos,
        'remaining', GREATEST(0, user_plan.max_disparos - COALESCE(daily_use.disparos_realizados, 0))
      );
    WHEN 'criar_conexao' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.conexoes_criadas, 0) + p_quantity) <= user_plan.max_conexoes,
        'current_usage', COALESCE(daily_use.conexoes_criadas, 0),
        'limit', user_plan.max_conexoes,
        'remaining', GREATEST(0, user_plan.max_conexoes - COALESCE(daily_use.conexoes_criadas, 0))
      );
    WHEN 'criar_template' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.templates_criados, 0) + p_quantity) <= user_plan.max_templates,
        'current_usage', COALESCE(daily_use.templates_criados, 0),
        'limit', user_plan.max_templates,
        'remaining', GREATEST(0, user_plan.max_templates - COALESCE(daily_use.templates_criados, 0))
      );
    ELSE
      result := json_build_object('error', 'Invalid action type: ' || p_action_type);
  END CASE;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'Function error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para debug das tabelas
CREATE OR REPLACE FUNCTION debug_plan_tables()
RETURNS TEXT AS $$
DECLARE
  result TEXT := '';
  user_plans_count INTEGER;
  daily_usage_count INTEGER;
BEGIN
  -- Verificar se as tabelas existem
  SELECT COUNT(*) INTO user_plans_count FROM information_schema.tables WHERE table_name = 'user_plans';
  SELECT COUNT(*) INTO daily_usage_count FROM information_schema.tables WHERE table_name = 'daily_usage';
  
  result := result || 'user_plans table exists: ' || (user_plans_count > 0)::TEXT || E'\n';
  result := result || 'daily_usage table exists: ' || (daily_usage_count > 0)::TEXT || E'\n';
  
  -- Se as tabelas existem, contar registros
  IF user_plans_count > 0 THEN
    SELECT COUNT(*) INTO user_plans_count FROM user_plans;
    result := result || 'user_plans records: ' || user_plans_count::TEXT || E'\n';
  END IF;
  
  IF daily_usage_count > 0 THEN
    SELECT COUNT(*) INTO daily_usage_count FROM daily_usage;
    result := result || 'daily_usage records: ' || daily_usage_count::TEXT || E'\n';
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 