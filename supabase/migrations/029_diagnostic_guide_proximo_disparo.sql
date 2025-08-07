-- Guia de diagnóstico completo para a função proximo_disparo
-- Execute estes comandos em sequência para identificar o problema

-- 1. Verificar se há disparos pendentes (comando básico)
-- SELECT COUNT(*) as total_pendentes FROM disparos_agendados WHERE status = 'pendente';

-- 2. Verificar disparos pendentes com detalhes
-- SELECT 
--   id, 
--   empresa_nome, 
--   status, 
--   agendado_para,
--   fase,
--   ordem,
--   CASE WHEN agendado_para <= now() THEN 'PASSADO' ELSE 'FUTURO' END as tempo_status
-- FROM disparos_agendados 
-- WHERE status = 'pendente' 
-- ORDER BY agendado_para ASC 
-- LIMIT 10;

-- 3. Testar função simples
-- SELECT * FROM test_disparos_simples();

-- 4. Verificar disparos detalhado
-- SELECT * FROM verificar_disparos_detalhado();

-- 5. Testar versão simplificada (sem condição de tempo)
-- SELECT * FROM proximo_disparo_simple();

-- 6. Verificar RLS
-- SELECT * FROM verificar_rls_disparos();

-- 7. Verificar timezone
-- SELECT current_setting('TIMEZONE') as timezone_atual, now() as hora_atual;

-- 8. Verificar estrutura da tabela
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable, 
--   column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'disparos_agendados' 
-- ORDER BY ordinal_position;

-- 9. Verificar índices
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'disparos_agendados';

-- 10. Testar consulta direta (simular a função)
-- WITH next_task AS (
--   SELECT t.id
--     FROM public.disparos_agendados t
--    WHERE t.status = 'pendente'
--      AND t.agendado_para <= now()
--    ORDER BY 
--      t.fase ASC,
--      t.ordem ASC,
--      t.agendado_para ASC
--    LIMIT 1
-- )
-- SELECT 
--   t.id, 
--   t.empresa_nome, 
--   t.status, 
--   t.agendado_para,
--   now() as hora_atual,
--   CASE WHEN t.agendado_para <= now() THEN 'SIM' ELSE 'NÃO' END as esta_no_passado
-- FROM public.disparos_agendados t
-- WHERE t.id IN (SELECT next_task.id FROM next_task);

-- 11. Verificar se há disparos em 'processando' que podem estar travados
-- SELECT COUNT(*) as total_processando FROM disparos_agendados WHERE status = 'processando';

-- 12. Resetar disparos em processamento (se necessário)
-- UPDATE disparos_agendados SET status = 'pendente' WHERE status = 'processando';

-- 13. Testar a função original
-- SELECT * FROM proximo_disparo();

-- 14. Verificar logs de debug (se disponível)
-- SELECT * FROM pg_stat_activity WHERE query LIKE '%proximo_disparo%';

-- Comandos para executar no SQL Editor do Supabase:

-- COMANDO 1: Verificar disparos básicos
-- SELECT COUNT(*) as total_pendentes FROM disparos_agendados WHERE status = 'pendente';

-- COMANDO 2: Verificar disparos com detalhes
-- SELECT 
--   id, 
--   empresa_nome, 
--   status, 
--   agendado_para,
--   fase,
--   ordem
-- FROM disparos_agendados 
-- WHERE status = 'pendente' 
-- ORDER BY agendado_para ASC 
-- LIMIT 5;

-- COMANDO 3: Testar função simples
-- SELECT * FROM test_disparos_simples();

-- COMANDO 4: Testar versão sem condição de tempo
-- SELECT * FROM proximo_disparo_simple();

-- COMANDO 5: Verificar RLS
-- SELECT * FROM verificar_rls_disparos();

-- COMANDO 6: Verificar timezone
-- SELECT current_setting('TIMEZONE') as timezone_atual, now() as hora_atual;

-- COMANDO 7: Resetar disparos travados (se necessário)
-- UPDATE disparos_agendados SET status = 'pendente' WHERE status = 'processando';

-- COMANDO 8: Testar função original
-- SELECT * FROM proximo_disparo();

-- Possíveis soluções baseadas nos resultados:

-- SOLUÇÃO 1: Se não há disparos pendentes
-- INSERT INTO disparos_agendados (empresa_id, empresa_nome, empresa_telefone, mensagem, status, agendado_para, conexao_id, ordem, fase)
-- VALUES (1, 'Empresa Teste', '55123456789@s.whatsapp.net', 'Mensagem teste', 'pendente', now() - interval '1 hour', 'Tech Leads', 1, 'fase_1');

-- SOLUÇÃO 2: Se há disparos mas estão no futuro
-- UPDATE disparos_agendados SET agendado_para = now() - interval '1 hour' WHERE status = 'pendente' AND agendado_para > now();

-- SOLUÇÃO 3: Se RLS está bloqueando
-- ALTER TABLE disparos_agendados DISABLE ROW LEVEL SECURITY;

-- SOLUÇÃO 4: Se timezone está causando problemas
-- SET timezone = 'UTC';

-- SOLUÇÃO 5: Se índices não existem
-- CREATE INDEX IF NOT EXISTS idx_disparos_agendados_status_agendado_para 
-- ON disparos_agendados (status, agendado_para) WHERE status = 'pendente'; 