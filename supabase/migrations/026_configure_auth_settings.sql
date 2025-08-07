-- Configurar autenticação para não exigir confirmação de email
-- Esta configuração deve ser feita no painel do Supabase, mas aqui está o SQL para referência

-- Para desabilitar a confirmação de email, você precisa:
-- 1. Ir ao painel do Supabase
-- 2. Navegar para Authentication > Settings
-- 3. Desabilitar "Enable email confirmations"

-- Alternativamente, você pode usar a API do Supabase para configurar isso
-- Mas a forma mais segura é através do painel administrativo

-- Comentário explicativo
COMMENT ON SCHEMA public IS 'Configuração de autenticação: Email confirmation pode ser desabilitada no painel do Supabase'; 