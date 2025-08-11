# Instruções para Executar a Migração

## Nova Migração: Adicionar WhatsApp e CPF aos Perfis

### Arquivo de Migração
A migração está localizada em: `supabase/migrations/076_add_whatsapp_cpf_to_profiles.sql`

### O que a migração faz:
1. **Adiciona colunas na tabela `profiles`:**
   - `whatsapp` (TEXT) - Número de WhatsApp do usuário
   - `cpf` (TEXT) - CPF do usuário

2. **Cria índices para performance:**
   - `idx_profiles_whatsapp` na coluna whatsapp
   - `idx_profiles_cpf` na coluna cpf

3. **Adiciona validações:**
   - CPF deve ter 11 dígitos numéricos
   - WhatsApp deve ter 10-11 dígitos numéricos

### Como executar:

#### Opção 1: Via Supabase Dashboard
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para "SQL Editor"
4. Cole o conteúdo do arquivo `076_add_whatsapp_cpf_to_profiles.sql`
5. Clique em "Run" para executar

#### Opção 2: Via Supabase CLI
```bash
# Se você tiver o Supabase CLI instalado
supabase db push

# Ou para aplicar uma migração específica
supabase migration up
```

#### Opção 3: Via psql (se tiver acesso direto ao banco)
```bash
psql -h [HOST] -U [USER] -d [DATABASE] -f supabase/migrations/076_add_whatsapp_cpf_to_profiles.sql
```

### Verificação:
Após executar a migração, você pode verificar se as colunas foram criadas:

```sql
-- Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Verificar se as novas colunas existem
SELECT whatsapp, cpf FROM profiles LIMIT 1;
```

### Notas Importantes:
- A migração é segura e não afeta dados existentes
- As novas colunas são opcionais (NULL permitido)
- As validações só se aplicam a novos dados inseridos
- Usuários existentes terão essas colunas como NULL

### Rollback (se necessário):
```sql
-- Remover as colunas (CUIDADO: isso apagará os dados)
ALTER TABLE profiles DROP COLUMN IF EXISTS whatsapp;
ALTER TABLE profiles DROP COLUMN IF EXISTS cpf;

-- Remover índices
DROP INDEX IF EXISTS idx_profiles_whatsapp;
DROP INDEX IF EXISTS idx_profiles_cpf;

-- Remover constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_cpf_format;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_whatsapp_format;
```

### Próximos Passos:
1. Execute a migração
2. Teste o cadastro com os novos campos
3. Verifique se os dados estão sendo salvos corretamente
4. Teste a funcionalidade de login existente 