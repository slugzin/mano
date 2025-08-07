-- Função para inicializar dados padrão para novos usuários
CREATE OR REPLACE FUNCTION initialize_new_user_data(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Inserir fluxo padrão
  INSERT INTO fluxos (id, nome, descricao, criado_em, ativo, user_id)
  VALUES (
    gen_random_uuid(),
    'Fluxo Padrão',
    'Fluxo inicial criado automaticamente para novos usuários',
    NOW(),
    true,
    user_id
  );

  -- Inserir frases padrão do WhatsApp
  INSERT INTO frases_whatsapp (
    fase, 
    tipo, 
    texto, 
    criada_em, 
    delay_seconds, 
    delay_min_seconds, 
    delay_max_seconds, 
    formato, 
    conteudo, 
    ordem, 
    aguardar_resposta, 
    ativo, 
    usuario_id
  ) VALUES 
  (
    'fase_1',
    'frase1',
    'Olá! Tudo bem?',
    NOW(),
    0,
    30,
    60,
    'text',
    'Olá! Tudo bem? 👋',
    1,
    false,
    true,
    user_id
  ),
  (
    'fase_1',
    'frase2',
    'Sou da equipe de vendas e gostaria de apresentar nossos produtos.',
    NOW(),
    0,
    30,
    60,
    'text',
    'Sou da equipe de vendas e gostaria de apresentar nossos produtos. 🚀',
    2,
    true,
    true,
    user_id
  ),
  (
    'fase_2',
    'frase1',
    'Tem interesse em conhecer mais sobre nossos serviços?',
    NOW(),
    0,
    30,
    60,
    'text',
    'Tem interesse em conhecer mais sobre nossos serviços? 💼',
    1,
    false,
    true,
    user_id
  );

  -- Inserir template de mensagem padrão
  INSERT INTO message_templates (
    id,
    nome,
    conteudo,
    tipo,
    criado_em,
    ativo,
    user_id
  ) VALUES (
    gen_random_uuid(),
    'Template Padrão',
    'Olá! Tudo bem? 👋\n\nSou da equipe de vendas e gostaria de apresentar nossos produtos. 🚀\n\nTem interesse em conhecer mais sobre nossos serviços? 💼',
    'text',
    NOW(),
    true,
    user_id
  );

  -- Inserir campanha padrão
  INSERT INTO campanhas_disparo (
    id,
    nome,
    descricao,
    status,
    criado_em,
    ativo,
    user_id
  ) VALUES (
    gen_random_uuid(),
    'Campanha Inicial',
    'Campanha criada automaticamente para novos usuários',
    'rascunho',
    NOW(),
    true,
    user_id
  );

  -- Log da inicialização
  RAISE NOTICE 'Dados padrão inicializados para usuário: %', user_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao inicializar dados para usuário %: %', user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se o usuário já tem dados
CREATE OR REPLACE FUNCTION user_has_data(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_fluxos BOOLEAN;
  has_frases BOOLEAN;
  has_templates BOOLEAN;
  has_campanhas BOOLEAN;
BEGIN
  -- Verificar se o usuário já tem fluxos
  SELECT EXISTS(SELECT 1 FROM fluxos WHERE id IN (
    SELECT fluxo_id FROM frases_whatsapp WHERE usuario_id = user_id
  )) INTO has_fluxos;
  
  -- Verificar se o usuário já tem frases
  SELECT EXISTS(SELECT 1 FROM frases_whatsapp WHERE usuario_id = user_id) INTO has_frases;
  
  -- Verificar se o usuário já tem templates
  SELECT EXISTS(SELECT 1 FROM message_templates WHERE usuario_id = user_id) INTO has_templates;
  
  -- Verificar se o usuário já tem campanhas
  SELECT EXISTS(SELECT 1 FROM campanhas_disparo WHERE usuario_id = user_id) INTO has_campanhas;
  
  RETURN has_fluxos OR has_frases OR has_templates OR has_campanhas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para inicializar dados automaticamente após criação do perfil
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Aguardar um pouco para garantir que o perfil foi criado
  PERFORM pg_sleep(0.1);
  
  -- Verificar se o usuário já tem dados
  IF NOT user_has_data(NEW.id) THEN
    -- Inicializar dados padrão
    PERFORM initialize_new_user_data(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para inicializar dados após criação do perfil
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Comentários para documentação
COMMENT ON FUNCTION initialize_new_user_data IS 'Inicializa dados padrão para novos usuários';
COMMENT ON FUNCTION user_has_data IS 'Verifica se o usuário já tem dados no sistema';
COMMENT ON FUNCTION handle_new_user_profile IS 'Trigger para inicializar dados após criação do perfil'; 