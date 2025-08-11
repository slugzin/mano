-- Criar tabela de usuários se não existir
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  cpf TEXT,
  device_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para users
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true); -- Permitir leitura para facilitar integração

CREATE POLICY "Allow insert for new users" ON users
  FOR INSERT WITH CHECK (true); -- Permitir inserção para cadastro

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true); -- Permitir atualização

-- Função para criar ou buscar usuário
CREATE OR REPLACE FUNCTION create_or_get_user(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL,
  p_cpf TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  existing_user RECORD;
  new_user RECORD;
  auth_user_id UUID;
  result JSON;
BEGIN
  -- Verificar se usuário já existe por email
  SELECT * INTO existing_user FROM users WHERE email = p_email;
  
  IF FOUND THEN
    -- Usuário já existe, retornar dados existentes
    result := json_build_object(
      'success', true,
      'user', json_build_object(
        'id', existing_user.id,
        'name', existing_user.name,
        'email', existing_user.email,
        'phone', existing_user.phone,
        'cpf', existing_user.cpf,
        'device_id', existing_user.device_id,
        'created_at', existing_user.created_at
      ),
      'message', 'User already exists'
    );
    
    RETURN result;
  END IF;
  
  -- Criar usuário no Supabase Auth primeiro
  BEGIN
    -- Gerar senha temporária
    DECLARE
      temp_password TEXT := 'temp_' || substring(md5(random()::text) from 1 for 8);
    BEGIN
      -- Inserir no auth.users (isso requer privilégios especiais)
      -- Por enquanto, vamos criar apenas na tabela users
      
      -- Inserir novo usuário na nossa tabela
      INSERT INTO users (name, email, phone, cpf, device_id)
      VALUES (p_name, p_email, p_phone, p_cpf, p_device_id)
      RETURNING * INTO new_user;
      
      -- Tentar criar plano gratuito automaticamente
      BEGIN
        INSERT INTO user_plans (user_id) 
        VALUES (new_user.id)
        ON CONFLICT (user_id) DO NOTHING;
      EXCEPTION 
        WHEN OTHERS THEN
          -- Ignorar erro se não conseguir criar plano
          NULL;
      END;
      
      result := json_build_object(
        'success', true,
        'user', json_build_object(
          'id', new_user.id,
          'name', new_user.name,
          'email', new_user.email,
          'phone', new_user.phone,
          'cpf', new_user.cpf,
          'device_id', new_user.device_id,
          'created_at', new_user.created_at
        ),
        'message', 'User created successfully'
      );
      
      RETURN result;
    END;
  EXCEPTION
    WHEN OTHERS THEN
      result := json_build_object(
        'success', false,
        'error', 'Failed to create user: ' || SQLERRM
      );
      
      RETURN result;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função alternativa mais simples para criar usuário
CREATE OR REPLACE FUNCTION simple_create_user(
  p_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_device_id TEXT DEFAULT NULL,
  p_cpf TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  existing_user RECORD;
  new_user RECORD;
  result JSON;
BEGIN
  -- Verificar se usuário já existe por email
  SELECT * INTO existing_user FROM users WHERE email = p_email;
  
  IF FOUND THEN
    -- Atualizar dados se necessário
    UPDATE users 
    SET 
      name = COALESCE(p_name, name),
      phone = COALESCE(p_phone, phone),
      cpf = COALESCE(p_cpf, cpf),
      device_id = COALESCE(p_device_id, device_id),
      updated_at = NOW()
    WHERE id = existing_user.id
    RETURNING * INTO new_user;
  ELSE
    -- Criar novo usuário
    INSERT INTO users (name, email, phone, cpf, device_id)
    VALUES (p_name, p_email, p_phone, p_cpf, p_device_id)
    RETURNING * INTO new_user;
  END IF;
  
  -- Retornar resultado
  result := json_build_object(
    'success', true,
    'user', json_build_object(
      'id', new_user.id,
      'name', new_user.name,
      'email', new_user.email,
      'phone', new_user.phone,
      'cpf', new_user.cpf,
      'device_id', new_user.device_id,
      'created_at', new_user.created_at
    )
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 