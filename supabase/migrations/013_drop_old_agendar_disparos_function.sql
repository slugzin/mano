-- Remover todas as versões antigas da função agendar_disparos
DROP FUNCTION IF EXISTS agendar_disparos(UUID[], TEXT, UUID, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS agendar_disparos(UUID[], TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS agendar_disparos(INTEGER[], TEXT, UUID, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT);

-- Garantir que apenas a versão correta existe
DROP FUNCTION IF EXISTS agendar_disparos(INTEGER[], TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, INTEGER, TEXT); 