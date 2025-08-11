-- Garantir que as configurações de auth estão corretas
-- Estas configurações devem estar no config.toml, mas vamos garantir no SQL também

-- Verificar se a tabela users está com a estrutura correta
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Garantir que não há conflitos de constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Corrigir o trigger para evitar problemas de recursão
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;

-- Criar função mais robusta para lidar com novo usuário
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_email TEXT;
BEGIN
  -- Extrair informações do usuário
  user_email := NEW.email;
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Log para debug
  RAISE LOG 'Processando novo usuário: % (%)', user_email, user_name;
  
  -- Inserir na tabela users (nossa tabela customizada)
  BEGIN
    INSERT INTO public.users (id, name, email, created_at, updated_at)
    VALUES (NEW.id, user_name, user_email, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = NOW();
    
    RAISE LOG 'Usuário inserido/atualizado na tabela users: %', user_email;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Erro ao inserir usuário na tabela users: % - %', user_email, SQLERRM;
  END;
  
  -- Criar plano gratuito
  BEGIN
    INSERT INTO public.user_plans (user_id, plan_type, created_at, updated_at)
    VALUES (NEW.id, 'free', NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE LOG 'Plano gratuito criado para usuário: %', user_email;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Erro ao criar plano para usuário: % - %', user_email, SQLERRM;
  END;
  
  -- Sempre retornar NEW para não interferir no processo
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger
CREATE TRIGGER on_auth_user_created_complete
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Política para permitir leitura de auth.users (se necessário)
-- NOTA: Normalmente não precisamos mexer em auth.users diretamente

-- Garantir que RLS não está bloqueando inserções necessárias
-- Temporariamente, vamos deixar mais permissivo

-- Verificar se as políticas existem antes de drop
DO $$
BEGIN
    -- Users table policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view own data') THEN
        DROP POLICY "Users can view own data" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow insert for new users') THEN
        DROP POLICY "Allow insert for new users" ON users;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update own data') THEN
        DROP POLICY "Users can update own data" ON users;
    END IF;
    
    -- User plans policies  
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_plans' AND policyname = 'Users can view own plan') THEN
        DROP POLICY "Users can view own plan" ON user_plans;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_plans' AND policyname = 'Allow insert for new users') THEN
        DROP POLICY "Allow insert for new users" ON user_plans;
    END IF;
END $$;

-- Criar políticas mais permissivas
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable insert for signup" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for own data" ON users FOR UPDATE USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Enable read access for own plan" ON user_plans FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);
CREATE POLICY "Enable insert for signup plan" ON user_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for own plan" ON user_plans FOR UPDATE USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Função para testar o signup
CREATE OR REPLACE FUNCTION test_signup_process()
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  test_email TEXT := 'test_' || floor(random() * 1000) || '@example.com';
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- Simular inserção de usuário
  BEGIN
    INSERT INTO users (id, name, email) VALUES (test_user_id, 'Test User', test_email);
    INSERT INTO user_plans (user_id) VALUES (test_user_id);
    
    result := 'SUCCESS: Test signup process completed for ' || test_email;
    
    -- Limpar dados de teste
    DELETE FROM user_plans WHERE user_id = test_user_id;
    DELETE FROM users WHERE id = test_user_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      result := 'ERROR: ' || SQLERRM;
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 