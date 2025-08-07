-- Renomear coluna titulo para empresa_nome na tabela empresas
ALTER TABLE empresas 
RENAME COLUMN titulo TO empresa_nome;

-- Atualizar comentário
COMMENT ON COLUMN empresas.empresa_nome IS 'Nome da empresa (obrigatório)';

-- Atualizar índice
DROP INDEX IF EXISTS idx_empresas_titulo;
CREATE INDEX IF NOT EXISTS idx_empresas_empresa_nome ON empresas (empresa_nome); 