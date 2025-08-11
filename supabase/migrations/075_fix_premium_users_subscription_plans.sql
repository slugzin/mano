-- Migração para corrigir usuários premium que ainda têm subscription_plan_id do plano gratuito

-- 1. Atualizar todos os usuários com plan_type = 'premium' para terem subscription_plan_id correto
UPDATE user_plans 
SET subscription_plan_id = (
  SELECT id FROM subscription_plans 
  WHERE name = 'Premium' AND is_active = true
)
WHERE plan_type = 'premium' 
  AND (subscription_plan_id IS NULL OR subscription_plan_id = (
    SELECT id FROM subscription_plans WHERE name = 'Gratuito' LIMIT 1
  ));

-- 2. Atualizar todos os usuários com plan_type = 'free' para terem subscription_plan_id correto
UPDATE user_plans 
SET subscription_plan_id = (
  SELECT id FROM subscription_plans 
  WHERE name = 'Gratuito' AND is_active = true
)
WHERE plan_type = 'free' 
  AND (subscription_plan_id IS NULL OR subscription_plan_id != (
    SELECT id FROM subscription_plans WHERE name = 'Gratuito' LIMIT 1
  ));

-- 3. Verificar se há usuários com plan_type = 'basic' e atualizar para o plano Básico
UPDATE user_plans 
SET subscription_plan_id = (
  SELECT id FROM subscription_plans 
  WHERE name = 'Básico' AND is_active = true
)
WHERE plan_type = 'basic' 
  AND (subscription_plan_id IS NULL OR subscription_plan_id != (
    SELECT id FROM subscription_plans WHERE name = 'Básico' LIMIT 1
  ));

-- 4. Função para sincronizar plan_type com subscription_plan automaticamente
CREATE OR REPLACE FUNCTION sync_plan_type_with_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar plan_type baseado no nome do subscription_plan
  IF NEW.subscription_plan_id IS NOT NULL THEN
    SELECT 
      CASE 
        WHEN sp.name = 'Premium' THEN 'premium'
        WHEN sp.name = 'Básico' THEN 'basic'
        ELSE 'free'
      END
    INTO NEW.plan_type
    FROM subscription_plans sp
    WHERE sp.id = NEW.subscription_plan_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para manter plan_type sincronizado
DROP TRIGGER IF EXISTS trigger_sync_plan_type ON user_plans;

CREATE TRIGGER trigger_sync_plan_type
  BEFORE INSERT OR UPDATE ON user_plans
  FOR EACH ROW
  EXECUTE FUNCTION sync_plan_type_with_subscription();

-- 6. Aplicar a sincronização em todos os registros existentes
UPDATE user_plans 
SET plan_type = CASE 
  WHEN sp.name = 'Premium' THEN 'premium'
  WHEN sp.name = 'Básico' THEN 'basic'
  ELSE 'free'
END
FROM subscription_plans sp
WHERE user_plans.subscription_plan_id = sp.id;

-- 7. Verificar e mostrar o resultado da correção
SELECT 
  up.user_id,
  up.plan_type,
  sp.name as subscription_plan_name,
  sp.limits->>'companies_per_month' as companies_per_month_limit,
  sp.limits->>'companies_per_day' as companies_per_day_limit,
  up.subscription_plan_id
FROM user_plans up
LEFT JOIN subscription_plans sp ON up.subscription_plan_id = sp.id
ORDER BY up.plan_type, sp.name; 