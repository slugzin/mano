-- Criar tabela para controle de planos de usuários
CREATE TABLE IF NOT EXISTS user_plans (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium')),
  
  -- Limites do plano
  max_empresas INTEGER NOT NULL DEFAULT 30,
  max_disparos INTEGER NOT NULL DEFAULT 15,
  max_conexoes INTEGER NOT NULL DEFAULT 1,
  max_templates INTEGER NOT NULL DEFAULT 1,
  
  -- Limites diários
  empresas_diarias INTEGER NOT NULL DEFAULT 15,
  disparos_diarios INTEGER NOT NULL DEFAULT 10,
  
  -- Controle temporal
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reset_date DATE DEFAULT CURRENT_DATE + INTERVAL '1 day',
  
  UNIQUE(user_id)
);

-- Criar tabela para histórico de uso diário
CREATE TABLE IF NOT EXISTS daily_usage (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Contadores de uso
  empresas_buscadas INTEGER NOT NULL DEFAULT 0,
  disparos_realizados INTEGER NOT NULL DEFAULT 0,
  conexoes_criadas INTEGER NOT NULL DEFAULT 0,
  templates_criados INTEGER NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, usage_date)
);

-- Habilitar RLS nas novas tabelas
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para user_plans
CREATE POLICY "Users can view own plan" ON user_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own plan" ON user_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for new users" ON user_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas de RLS para daily_usage
CREATE POLICY "Users can view own usage" ON daily_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON daily_usage
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow insert for daily usage" ON daily_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para inicializar plano gratuito para novos usuários
CREATE OR REPLACE FUNCTION initialize_user_plan()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_plans (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para inicializar plano automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION initialize_user_plan();

-- Função para incrementar uso diário
CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id UUID,
  p_usage_type TEXT,
  p_quantity INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  current_date DATE := CURRENT_DATE;
BEGIN
  -- Inserir ou atualizar uso diário
  INSERT INTO daily_usage (user_id, usage_date, empresas_buscadas, disparos_realizados, conexoes_criadas, templates_criados)
  VALUES (
    p_user_id, 
    current_date,
    CASE WHEN p_usage_type = 'empresas' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'disparos' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'conexoes' THEN p_quantity ELSE 0 END,
    CASE WHEN p_usage_type = 'templates' THEN p_quantity ELSE 0 END
  )
  ON CONFLICT (user_id, usage_date) 
  DO UPDATE SET
    empresas_buscadas = daily_usage.empresas_buscadas + 
      CASE WHEN p_usage_type = 'empresas' THEN p_quantity ELSE 0 END,
    disparos_realizados = daily_usage.disparos_realizados + 
      CASE WHEN p_usage_type = 'disparos' THEN p_quantity ELSE 0 END,
    conexoes_criadas = daily_usage.conexoes_criadas + 
      CASE WHEN p_usage_type = 'conexoes' THEN p_quantity ELSE 0 END,
    templates_criados = daily_usage.templates_criados + 
      CASE WHEN p_usage_type = 'templates' THEN p_quantity ELSE 0 END,
    updated_at = NOW();
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar limites do usuário
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
  -- Buscar plano do usuário
  SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    INSERT INTO user_plans (user_id) VALUES (p_user_id);
    SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
  END IF;
  
  -- Buscar uso diário
  SELECT * INTO daily_use FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = current_date;
  
  IF NOT FOUND THEN
    daily_use := ROW(NULL, p_user_id, current_date, 0, 0, 0, 0, NOW(), NOW());
  END IF;
  
  -- Verificar limites baseado no tipo de ação
  CASE p_action_type
    WHEN 'buscar_empresas' THEN
      result := json_build_object(
        'can_perform', (daily_use.empresas_buscadas + p_quantity) <= user_plan.max_empresas,
        'current_usage', daily_use.empresas_buscadas,
        'limit', user_plan.max_empresas,
        'remaining', GREATEST(0, user_plan.max_empresas - daily_use.empresas_buscadas)
      );
    WHEN 'fazer_disparo' THEN
      result := json_build_object(
        'can_perform', (daily_use.disparos_realizados + p_quantity) <= user_plan.max_disparos,
        'current_usage', daily_use.disparos_realizados,
        'limit', user_plan.max_disparos,
        'remaining', GREATEST(0, user_plan.max_disparos - daily_use.disparos_realizados)
      );
    WHEN 'criar_conexao' THEN
      result := json_build_object(
        'can_perform', (daily_use.conexoes_criadas + p_quantity) <= user_plan.max_conexoes,
        'current_usage', daily_use.conexoes_criadas,
        'limit', user_plan.max_conexoes,
        'remaining', GREATEST(0, user_plan.max_conexoes - daily_use.conexoes_criadas)
      );
    WHEN 'criar_template' THEN
      result := json_build_object(
        'can_perform', (daily_use.templates_criados + p_quantity) <= user_plan.max_templates,
        'current_usage', daily_use.templates_criados,
        'limit', user_plan.max_templates,
        'remaining', GREATEST(0, user_plan.max_templates - daily_use.templates_criados)
      );
    ELSE
      result := json_build_object('error', 'Invalid action type');
  END CASE;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter estatísticas de uso do usuário
CREATE OR REPLACE FUNCTION get_user_usage_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  user_plan RECORD;
  daily_use RECORD;
  current_date DATE := CURRENT_DATE;
  result JSON;
BEGIN
  -- Buscar plano do usuário
  SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Criar plano padrão se não existir
    INSERT INTO user_plans (user_id) VALUES (p_user_id);
    SELECT * INTO user_plan FROM user_plans WHERE user_id = p_user_id;
  END IF;
  
  -- Buscar uso diário
  SELECT * INTO daily_use FROM daily_usage 
  WHERE user_id = p_user_id AND usage_date = current_date;
  
  IF NOT FOUND THEN
    daily_use := ROW(NULL, p_user_id, current_date, 0, 0, 0, 0, NOW(), NOW());
  END IF;
  
  result := json_build_object(
    'plan_type', user_plan.plan_type,
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
    'reset_date', user_plan.reset_date
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 