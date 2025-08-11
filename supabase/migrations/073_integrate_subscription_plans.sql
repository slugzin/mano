-- Migração para integrar subscription_plans com user_plans
-- e corrigir o sistema de limites

-- 1. Adicionar coluna subscription_plan_id na tabela user_plans
ALTER TABLE user_plans 
ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id);

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_plans_subscription_plan_id 
ON user_plans (subscription_plan_id);

-- 3. Atualizar user_plans existentes para referenciar o plano gratuito
UPDATE user_plans 
SET subscription_plan_id = (
  SELECT id FROM subscription_plans 
  WHERE name = 'Gratuito' 
  LIMIT 1
)
WHERE subscription_plan_id IS NULL;

-- 4. Função atualizada para obter limites baseado no subscription_plan
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_plan RECORD;
  daily_use RECORD;
  subscription_plan RECORD;
  current_date DATE := CURRENT_DATE;
  result JSON;
BEGIN
  -- Buscar plano do usuário
  SELECT up.*, sp.name as plan_name, sp.limits
  INTO user_plan
  FROM user_plans up
  LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
  WHERE up.user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    INSERT INTO user_plans (user_id, subscription_plan_id) 
    VALUES (p_user_id, (SELECT id FROM subscription_plans WHERE name = 'Gratuito' LIMIT 1));
    
    SELECT up.*, sp.name as plan_name, sp.limits
    INTO user_plan
    FROM user_plans up
    LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
    WHERE up.user_id = p_user_id;
  END IF;
  
  -- Buscar uso diário
  SELECT * INTO daily_use FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = current_date;
  
  IF NOT FOUND THEN
    daily_use := ROW(NULL, p_user_id, current_date, 0, 0, 0, 0, NOW(), NOW());
  END IF;
  
  -- Extrair limites do subscription_plan ou usar valores padrão de user_plans
  IF user_plan.limits IS NOT NULL THEN
    result := json_build_object(
      'plan_type', user_plan.plan_name,
      'max_empresas', COALESCE((user_plan.limits->>'companies_per_month')::integer, (user_plan.limits->>'companies_per_day')::integer, user_plan.max_empresas),
      'max_disparos', COALESCE((user_plan.limits->>'dispatches_per_month')::integer, (user_plan.limits->>'dispatches_per_day')::integer, user_plan.max_disparos),
      'max_conexoes', COALESCE((user_plan.limits->>'whatsapp_connections')::integer, user_plan.max_conexoes),
      'max_templates', COALESCE((user_plan.limits->>'templates')::integer, user_plan.max_templates),
      'empresas_diarias', user_plan.empresas_diarias,
      'disparos_diarios', user_plan.disparos_diarios,
      'empresas_usadas', daily_use.empresas_buscadas,
      'disparos_usados', daily_use.disparos_realizados,
      'conexoes_usadas', daily_use.conexoes_criadas,
      'templates_usados', daily_use.templates_criados,
      'reset_date', user_plan.reset_date,
      'subscription_plan_id', user_plan.subscription_plan_id
    );
  ELSE
    -- Fallback para valores padrão
    result := json_build_object(
      'plan_type', COALESCE(user_plan.plan_name, user_plan.plan_type),
      'max_empresas', user_plan.max_empresas,
      'max_disparos', user_plan.max_disparos,
      'max_conexoes', user_plan.max_conexoes,
      'max_templates', user_plan.max_templates,
      'empresas_diarias', user_plan.empresas_diarias,
      'disparos_diarios', user_plan.disparos_diarios,
      'empresas_usadas', daily_use.empresas_buscadas,
      'disparos_usados', daily_use.disparos_realizados,
      'conexoes_usadas', daily_use.conexoes_criadas,
      'templates_usados', daily_use.templates_criados,
      'reset_date', user_plan.reset_date,
      'subscription_plan_id', user_plan.subscription_plan_id
    );
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função atualizada para verificar limites baseado no subscription_plan
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
  -- Buscar plano do usuário com subscription_plan
  SELECT up.*, sp.limits
  INTO user_plan
  FROM user_plans up
  LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
  WHERE up.user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    INSERT INTO user_plans (user_id, subscription_plan_id) 
    VALUES (p_user_id, (SELECT id FROM subscription_plans WHERE name = 'Gratuito' LIMIT 1));
    
    SELECT up.*, sp.limits
    INTO user_plan
    FROM user_plans up
    LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
    WHERE up.user_id = p_user_id;
  END IF;
  
  -- Buscar uso diário
  SELECT * INTO daily_use FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = current_date;
  
  IF NOT FOUND THEN
    daily_use := ROW(NULL, p_user_id, current_date, 0, 0, 0, 0, NOW(), NOW());
  END IF;
  
  -- Definir limites baseado no subscription_plan ou fallback para user_plans
  IF user_plan.limits IS NOT NULL THEN
    max_empresas := COALESCE((user_plan.limits->>'companies_per_month')::integer, (user_plan.limits->>'companies_per_day')::integer, user_plan.max_empresas);
    max_disparos := COALESCE((user_plan.limits->>'dispatches_per_month')::integer, (user_plan.limits->>'dispatches_per_day')::integer, user_plan.max_disparos);
    max_conexoes := COALESCE((user_plan.limits->>'whatsapp_connections')::integer, user_plan.max_conexoes);
    max_templates := COALESCE((user_plan.limits->>'templates')::integer, user_plan.max_templates);
  ELSE
    max_empresas := user_plan.max_empresas;
    max_disparos := user_plan.max_disparos;
    max_conexoes := user_plan.max_conexoes;
    max_templates := user_plan.max_templates;
  END IF;
  
  -- Verificar limites baseado no tipo de ação
  CASE p_action_type
    WHEN 'buscar_empresas' THEN
      result := json_build_object(
        'can_perform', (daily_use.empresas_buscadas + p_quantity) <= max_empresas,
        'current_usage', daily_use.empresas_buscadas,
        'limit', max_empresas,
        'remaining', GREATEST(0, max_empresas - daily_use.empresas_buscadas)
      );
    WHEN 'fazer_disparo' THEN
      result := json_build_object(
        'can_perform', (daily_use.disparos_realizados + p_quantity) <= max_disparos,
        'current_usage', daily_use.disparos_realizados,
        'limit', max_disparos,
        'remaining', GREATEST(0, max_disparos - daily_use.disparos_realizados)
      );
    WHEN 'criar_conexao' THEN
      result := json_build_object(
        'can_perform', (daily_use.conexoes_criadas + p_quantity) <= max_conexoes,
        'current_usage', daily_use.conexoes_criadas,
        'limit', max_conexoes,
        'remaining', GREATEST(0, max_conexoes - daily_use.conexoes_criadas)
      );
    WHEN 'criar_template' THEN
      result := json_build_object(
        'can_perform', (daily_use.templates_criados + p_quantity) <= max_templates,
        'current_usage', daily_use.templates_criados,
        'limit', max_templates,
        'remaining', GREATEST(0, max_templates - daily_use.templates_criados)
      );
    ELSE
      result := json_build_object('error', 'Invalid action type');
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para alterar plano de um usuário facilmente
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
      'error', 'Plano não encontrado: ' || p_plan_name
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

-- 7. Função para listar todos os usuários com seus planos
CREATE OR REPLACE FUNCTION list_users_with_plans()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  plan_name TEXT,
  max_empresas INTEGER,
  max_disparos INTEGER,
  max_conexoes INTEGER,
  max_templates INTEGER,
  empresas_usadas INTEGER,
  disparos_usados INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email::TEXT,
    COALESCE(sp.name, 'Sem Plano')::TEXT as plan_name,
    COALESCE(
      (sp.limits->>'companies_per_month')::integer, 
      (sp.limits->>'companies_per_day')::integer, 
      up.max_empresas,
      30
    ) as max_empresas,
    COALESCE(
      (sp.limits->>'dispatches_per_month')::integer, 
      (sp.limits->>'dispatches_per_day')::integer, 
      up.max_disparos,
      15
    ) as max_disparos,
    COALESCE(
      (sp.limits->>'whatsapp_connections')::integer, 
      up.max_conexoes,
      1
    ) as max_conexoes,
    COALESCE(
      (sp.limits->>'templates')::integer, 
      up.max_templates,
      1
    ) as max_templates,
    COALESCE(du.empresas_buscadas, 0) as empresas_usadas,
    COALESCE(du.disparos_realizados, 0) as disparos_usados,
    u.created_at
  FROM auth.users u
  LEFT JOIN user_plans up ON u.id = up.user_id
  LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
  LEFT JOIN daily_usage du ON u.id = du.user_id AND du.usage_date = CURRENT_DATE
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 