-- Migração para corrigir integração com subscription_plans sem resetar banco

-- 1. Adicionar coluna subscription_plan_id na tabela user_plans se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_plans' 
        AND column_name = 'subscription_plan_id'
    ) THEN
        ALTER TABLE user_plans 
        ADD COLUMN subscription_plan_id UUID REFERENCES subscription_plans(id);
        
        -- Criar índice
        CREATE INDEX IF NOT EXISTS idx_user_plans_subscription_plan_id 
        ON user_plans (subscription_plan_id);
    END IF;
END $$;

-- 2. Atualizar user_plans existentes para referenciar o plano correto baseado no plan_type
UPDATE user_plans 
SET subscription_plan_id = (
  SELECT sp.id FROM subscription_plans sp
  WHERE CASE 
    WHEN user_plans.plan_type = 'free' THEN sp.name = 'Gratuito'
    WHEN user_plans.plan_type = 'premium' THEN sp.name = 'Premium'
    ELSE sp.name = 'Gratuito'
  END
  AND sp.is_active = true
  LIMIT 1
)
WHERE subscription_plan_id IS NULL;

-- 3. Função CORRIGIDA para obter limites baseado no subscription_plan
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_plan RECORD;
  daily_use RECORD;
  current_date DATE := CURRENT_DATE;
  result JSON;
  max_empresas INTEGER;
  max_disparos INTEGER;
  max_conexoes INTEGER;
  max_templates INTEGER;
  plan_name TEXT;
BEGIN
  -- Verificar se o usuário foi fornecido
  IF p_user_id IS NULL THEN
    RETURN json_build_object('error', 'User ID is required');
  END IF;
  
  -- Buscar plano do usuário com subscription_plan
  SELECT 
    up.*,
    sp.name as subscription_plan_name,
    sp.limits as subscription_limits
  INTO user_plan
  FROM user_plans up
  LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
  WHERE up.user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    BEGIN
      INSERT INTO user_plans (user_id, subscription_plan_id) 
      VALUES (p_user_id, (SELECT id FROM subscription_plans WHERE name = 'Gratuito' LIMIT 1));
      
      SELECT 
        up.*,
        sp.name as subscription_plan_name,
        sp.limits as subscription_limits
      INTO user_plan
      FROM user_plans up
      LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
      WHERE up.user_id = p_user_id;
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
  
  -- Definir limites baseado no subscription_plan ou fallback para user_plans
  IF user_plan.subscription_limits IS NOT NULL THEN
    -- Usar limites do subscription_plan
    max_empresas := COALESCE(
      (user_plan.subscription_limits->>'companies_per_month')::integer, 
      (user_plan.subscription_limits->>'companies_per_day')::integer, 
      user_plan.max_empresas,
      30
    );
    max_disparos := COALESCE(
      (user_plan.subscription_limits->>'dispatches_per_month')::integer, 
      (user_plan.subscription_limits->>'dispatches_per_day')::integer, 
      user_plan.max_disparos,
      15
    );
    max_conexoes := COALESCE(
      (user_plan.subscription_limits->>'whatsapp_connections')::integer, 
      user_plan.max_conexoes,
      1
    );
    max_templates := COALESCE(
      (user_plan.subscription_limits->>'templates')::integer, 
      user_plan.max_templates,
      1
    );
    plan_name := COALESCE(user_plan.subscription_plan_name, user_plan.plan_type, 'Gratuito');
  ELSE
    -- Fallback para valores de user_plans
    max_empresas := user_plan.max_empresas;
    max_disparos := user_plan.max_disparos;
    max_conexoes := user_plan.max_conexoes;
    max_templates := user_plan.max_templates;
    plan_name := user_plan.plan_type;
  END IF;
  
  -- Construir resultado
  result := json_build_object(
    'plan_type', plan_name,
    'max_empresas', max_empresas,
    'max_disparos', max_disparos,
    'max_conexoes', max_conexoes,
    'max_templates', max_templates,
    'empresas_diarias', user_plan.empresas_diarias,
    'disparos_diarios', user_plan.disparos_diarios,
    'empresas_usadas', COALESCE(daily_use.empresas_buscadas, 0),
    'disparos_usados', COALESCE(daily_use.disparos_realizados, 0),
    'conexoes_usadas', COALESCE(daily_use.conexoes_criadas, 0),
    'templates_usados', COALESCE(daily_use.templates_criados, 0),
    'reset_date', user_plan.reset_date,
    'subscription_plan_id', user_plan.subscription_plan_id,
    'subscription_plan_name', user_plan.subscription_plan_name
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', 'Function error: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função CORRIGIDA para verificar limites baseado no subscription_plan
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
  max_empresas INTEGER;
  max_disparos INTEGER;
  max_conexoes INTEGER;
  max_templates INTEGER;
BEGIN
  -- Verificar se os parâmetros foram fornecidos
  IF p_user_id IS NULL OR p_action_type IS NULL THEN
    RETURN json_build_object('error', 'User ID and action type are required');
  END IF;
  
  -- Buscar plano do usuário com subscription_plan
  SELECT 
    up.*,
    sp.limits as subscription_limits
  INTO user_plan
  FROM user_plans up
  LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
  WHERE up.user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    BEGIN
      INSERT INTO user_plans (user_id, subscription_plan_id) 
      VALUES (p_user_id, (SELECT id FROM subscription_plans WHERE name = 'Gratuito' LIMIT 1));
      
      SELECT 
        up.*,
        sp.limits as subscription_limits
      INTO user_plan
      FROM user_plans up
      LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
      WHERE up.user_id = p_user_id;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN json_build_object('error', 'Failed to create user plan: ' || SQLERRM);
    END;
  END IF;
  
  -- Buscar uso diário
  SELECT * INTO daily_use FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = current_date;
  
  -- Se não encontrou uso diário, usar valores padrão
  IF NOT FOUND THEN
    daily_use := ROW(NULL, p_user_id, current_date, 0, 0, 0, 0, NOW(), NOW());
  END IF;
  
  -- Definir limites baseado no subscription_plan ou fallback para user_plans
  IF user_plan.subscription_limits IS NOT NULL THEN
    max_empresas := COALESCE(
      (user_plan.subscription_limits->>'companies_per_month')::integer, 
      (user_plan.subscription_limits->>'companies_per_day')::integer, 
      user_plan.max_empresas,
      30
    );
    max_disparos := COALESCE(
      (user_plan.subscription_limits->>'dispatches_per_month')::integer, 
      (user_plan.subscription_limits->>'dispatches_per_day')::integer, 
      user_plan.max_disparos,
      15
    );
    max_conexoes := COALESCE(
      (user_plan.subscription_limits->>'whatsapp_connections')::integer, 
      user_plan.max_conexoes,
      1
    );
    max_templates := COALESCE(
      (user_plan.subscription_limits->>'templates')::integer, 
      user_plan.max_templates,
      1
    );
  ELSE
    -- Fallback para valores de user_plans
    max_empresas := user_plan.max_empresas;
    max_disparos := user_plan.max_disparos;
    max_conexoes := user_plan.max_conexoes;
    max_templates := user_plan.max_templates;
  END IF;
  
  -- Verificar limites baseado no tipo de ação
  CASE p_action_type
    WHEN 'buscar_empresas' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.empresas_buscadas, 0) + p_quantity) <= max_empresas,
        'current_usage', COALESCE(daily_use.empresas_buscadas, 0),
        'limit', max_empresas,
        'remaining', GREATEST(0, max_empresas - COALESCE(daily_use.empresas_buscadas, 0))
      );
    WHEN 'fazer_disparo' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.disparos_realizados, 0) + p_quantity) <= max_disparos,
        'current_usage', COALESCE(daily_use.disparos_realizados, 0),
        'limit', max_disparos,
        'remaining', GREATEST(0, max_disparos - COALESCE(daily_use.disparos_realizados, 0))
      );
    WHEN 'criar_conexao' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.conexoes_criadas, 0) + p_quantity) <= max_conexoes,
        'current_usage', COALESCE(daily_use.conexoes_criadas, 0),
        'limit', max_conexoes,
        'remaining', GREATEST(0, max_conexoes - COALESCE(daily_use.conexoes_criadas, 0))
      );
    WHEN 'criar_template' THEN
      result := json_build_object(
        'can_perform', (COALESCE(daily_use.templates_criados, 0) + p_quantity) <= max_templates,
        'current_usage', COALESCE(daily_use.templates_criados, 0),
        'limit', max_templates,
        'remaining', GREATEST(0, max_templates - COALESCE(daily_use.templates_criados, 0))
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

-- 5. Função para alterar plano de um usuário facilmente
CREATE OR REPLACE FUNCTION change_user_plan(
  p_user_id UUID,
  p_plan_name TEXT
)
RETURNS JSON AS $$
DECLARE
  subscription_plan_id UUID;
  result JSON;
BEGIN
  -- Buscar o ID do plano
  SELECT id INTO subscription_plan_id 
  FROM subscription_plans 
  WHERE name = p_plan_name AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Plano não encontrado: ' || p_plan_name,
      'available_plans', (
        SELECT json_agg(name) FROM subscription_plans WHERE is_active = true
      )
    );
  END IF;
  
  -- Atualizar ou inserir user_plan
  INSERT INTO user_plans (user_id, subscription_plan_id, updated_at)
  VALUES (p_user_id, subscription_plan_id, NOW())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    subscription_plan_id = EXCLUDED.subscription_plan_id,
    updated_at = NOW();
  
  result := json_build_object(
    'success', true,
    'message', 'Plano alterado para: ' || p_plan_name,
    'user_id', p_user_id,
    'subscription_plan_id', subscription_plan_id
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 