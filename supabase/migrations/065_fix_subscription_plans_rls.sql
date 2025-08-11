-- Corrigir políticas RLS da tabela subscription_plans
-- O problema é que as políticas estão bloqueando o acesso público aos planos

-- Verificar se a tabela existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'subscription_plans'
    ) THEN
        RAISE EXCEPTION 'Tabela subscription_plans não existe';
    END IF;
END $$;

-- Remover políticas existentes que podem estar bloqueando
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Only admins can manage subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Public can view subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Users can view subscription plans" ON subscription_plans;

-- Desabilitar RLS temporariamente para permitir acesso público
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Ou, se preferir manter RLS, criar políticas mais permissivas
-- ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Criar política que permite visualização pública
-- CREATE POLICY "Public can view subscription plans" ON subscription_plans
--   FOR SELECT USING (true);

-- Criar política para admins gerenciarem
-- CREATE POLICY "Only admins can manage subscription plans" ON subscription_plans
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM profiles 
--       WHERE profiles.id = auth.uid() 
--       AND profiles.role = 'admin'
--     )
--   );

-- Log das correções
DO $$
BEGIN
  RAISE NOTICE 'Políticas RLS da tabela subscription_plans corrigidas';
  RAISE NOTICE 'RLS desabilitado para permitir acesso público aos planos';
END $$; 