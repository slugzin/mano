-- Guia de teste para a função proximo_disparo
-- Execute estes comandos no SQL Editor do Supabase para testar

-- 1. Verificar disparos disponíveis
-- SELECT * FROM verificar_disparos_disponiveis();

-- 2. Testar a função proximo_disparo
-- SELECT * FROM test_proximo_disparo();

-- 3. Verificar disparos pendentes com debug
-- SELECT * FROM debug_disparos_pendentes();

-- 4. Verificar timezone e datas
-- SELECT * FROM verificar_timezone_datas();

-- 5. Testar versão alternativa (sem condição de tempo)
-- SELECT * FROM proximo_disparo_alt();

-- 6. Verificar estrutura da tabela
-- SELECT * FROM verificar_estrutura_disparos_agendados();

-- 7. Inserir disparo de teste
-- SELECT inserir_disparo_teste();

-- 8. Limpar disparos de teste
-- SELECT limpar_disparos_teste();

-- 9. Resetar disparos em processamento
-- SELECT reset_disparos_processando();

-- 10. Verificar disparos pendentes simples
-- SELECT 
--   id, 
--   empresa_nome, 
--   empresa_telefone, 
--   status, 
--   agendado_para,
--   fase,
--   ordem,
--   CASE WHEN agendado_para <= now() THEN 'PASSADO' ELSE 'FUTURO' END as tempo_status
-- FROM disparos_agendados 
-- WHERE status = 'pendente' 
-- ORDER BY agendado_para ASC 
-- LIMIT 10;

-- 11. Verificar disparos no passado especificamente
-- SELECT 
--   id, 
--   empresa_nome, 
--   empresa_telefone, 
--   agendado_para,
--   EXTRACT(EPOCH FROM (now() - agendado_para))/3600 as horas_atrasado
-- FROM disparos_agendados 
-- WHERE status = 'pendente' 
--   AND agendado_para <= now()
-- ORDER BY agendado_para ASC 
-- LIMIT 5;

-- 12. Testar a função proximo_disparo diretamente
-- SELECT * FROM proximo_disparo();

-- Comentários sobre possíveis problemas:

-- PROBLEMA 1: Timezone
-- Se o timezone do banco estiver diferente do esperado, pode causar problemas
-- Solução: Verificar com SELECT current_setting('TIMEZONE');

-- PROBLEMA 2: Disparos travados em 'processando'
-- Se disparos ficaram em status 'processando', não serão retornados
-- Solução: Usar SELECT reset_disparos_processando();

-- PROBLEMA 3: Condição de tempo muito restritiva
-- Se a condição agendado_para <= now() estiver muito restritiva
-- Solução: Testar com proximo_disparo_alt() que remove essa condição

-- PROBLEMA 4: Índices não criados
-- Se os índices não foram criados, a consulta pode ser lenta
-- Solução: Verificar se os índices existem com:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'disparos_agendados';

-- PROBLEMA 5: RLS (Row Level Security)
-- Se RLS estiver ativo, pode estar bloqueando a consulta
-- Solução: Verificar políticas RLS com:
-- SELECT * FROM pg_policies WHERE tablename = 'disparos_agendados'; 