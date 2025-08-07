-- Script para verificar a estrutura atual do banco de dados
-- e identificar quais tabelas precisam de coluna user_id

-- Verificar estrutura da tabela empresas
SELECT 
    'empresas' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela fluxos
SELECT 
    'fluxos' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'fluxos' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela frases_whatsapp
SELECT 
    'frases_whatsapp' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'frases_whatsapp' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela message_templates
SELECT 
    'message_templates' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'message_templates' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela campanhas_disparo
SELECT 
    'campanhas_disparo' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campanhas_disparo' 
ORDER BY ordinal_position;

-- Verificar estrutura da tabela conversas
SELECT 
    'conversas' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversas' 
ORDER BY ordinal_position;

-- Verificar se existem colunas user_id ou email nas tabelas principais
SELECT 
    t.table_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns c 
                   WHERE c.table_name = t.table_name AND c.column_name = 'user_id') 
        THEN 'TEM user_id'
        ELSE 'SEM user_id'
    END as has_user_id,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.columns c 
                   WHERE c.table_name = t.table_name AND c.column_name = 'email') 
        THEN 'TEM email'
        ELSE 'SEM email'
    END as has_email
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
  AND t.table_name IN ('empresas', 'fluxos', 'frases_whatsapp', 'message_templates', 'campanhas_disparo', 'conversas')
ORDER BY t.table_name;

-- Contar registros em cada tabela
SELECT 'empresas' as table_name, COUNT(*) as total_records FROM empresas
UNION ALL
SELECT 'fluxos' as table_name, COUNT(*) as total_records FROM fluxos
UNION ALL
SELECT 'frases_whatsapp' as table_name, COUNT(*) as total_records FROM frases_whatsapp
UNION ALL
SELECT 'message_templates' as table_name, COUNT(*) as total_records FROM message_templates
UNION ALL
SELECT 'campanhas_disparo' as table_name, COUNT(*) as total_records FROM campanhas_disparo
UNION ALL
SELECT 'conversas' as table_name, COUNT(*) as total_records FROM conversas; 