# Teste do Novo Sistema de Cadastro

## Funcionalidades Implementadas

### ✅ Campos Obrigatórios no Cadastro:
1. **Nome Completo** - Campo de texto obrigatório
2. **WhatsApp** - Campo de telefone com formatação automática
3. **CPF** - Campo de CPF com formatação automática e **validação oficial brasileira**
4. **Email** - Campo de email obrigatório
5. **Senha** - Campo de senha obrigatório

### ✅ Formatação Automática:
- **WhatsApp**: `(11) 99999-9999` - Formata automaticamente conforme digita
- **CPF**: `000.000.000-00` - Formata automaticamente conforme digita

### ✅ Validações Avançadas:
- Todos os campos são obrigatórios no cadastro
- **CPF validado com algoritmo oficial brasileiro** (Receita Federal)
- WhatsApp deve ter 10-11 dígitos
- Email deve ser válido
- Senha deve ter pelo menos 6 caracteres

### ✅ Validação de CPF em Tempo Real:
- **Verificação dos dígitos verificadores** (algoritmo oficial)
- **Feedback visual imediato** (borda verde/vermelha)
- **Ícones de validação** (✓ verde para válido, ✗ vermelho para inválido)
- **Mensagens de erro específicas** para cada tipo de problema
- **Botão de cadastro desabilitado** até CPF ser válido

## Como Testar

### 1. Teste de Cadastro:
1. Acesse a página de login
2. Clique em "Criar conta"
3. Preencha todos os campos:
   - Nome: "João Silva"
   - WhatsApp: "11999999999" (será formatado automaticamente)
   - CPF: "12345678909" (CPF válido - será formatado automaticamente)
   - Email: "joao@teste.com"
   - Senha: "123456"
4. Clique em "Criar conta"
5. Verifique se aparece a mensagem de confirmação de email

### 2. Teste de Formatação:
- **WhatsApp**: Digite "11999999999" → Deve ficar "(11) 99999-9999"
- **CPF**: Digite "12345678909" → Deve ficar "123.456.789-09"

### 3. Teste de Validação de CPF:

#### ✅ CPFs Válidos para Teste:
- `123.456.789-09` (CPF válido)
- `987.654.321-00` (CPF válido)
- `111.444.777-35` (CPF válido)
- `000.000.001-91` (CPF válido)

#### ❌ CPFs Inválidos para Teste:
- `111.111.111-11` (todos dígitos iguais - inválido)
- `123.456.789-10` (dígitos verificadores incorretos)
- `000.000.000-00` (todos dígitos iguais - inválido)
- `111.444.777-34` (primeiro dígito verificador incorreto)
- `111.444.777-36` (segundo dígito verificador incorreto)

#### 🔍 Como Testar a Validação:
1. Digite um CPF inválido (ex: "11111111111")
2. Observe a borda ficar vermelha
3. Veja o ícone ✗ vermelho aparecer
4. Leia a mensagem de erro específica
5. Digite um CPF válido (ex: "12345678909")
6. Observe a borda ficar verde
7. Veja o ícone ✓ verde aparecer
8. O botão "Criar conta" deve ficar habilitado

### 4. Teste de Validação:
- Tente criar conta sem preencher algum campo
- Deve aparecer mensagem de erro específica
- Tente usar CPF com menos de 11 dígitos
- Tente usar CPF inválido (deve mostrar erro específico)
- Tente usar WhatsApp com formato inválido

### 5. Teste de Login:
1. Após criar conta, volte para o login
2. Use as credenciais criadas
3. Verifique se faz login corretamente

## Dados de Teste Sugeridos

### Usuário 1 (CPF Válido):
- Nome: "Maria Santos"
- WhatsApp: "11988888888"
- CPF: "98765432100" (CPF válido)
- Email: "maria@teste.com"
- Senha: "123456"

### Usuário 2 (CPF Válido):
- Nome: "Pedro Oliveira"
- WhatsApp: "11977777777"
- CPF: "11144477735" (CPF válido)
- Email: "pedro@teste.com"
- Senha: "123456"

### Usuário 3 (CPF Inválido - para testar validação):
- Nome: "Ana Silva"
- WhatsApp: "11966666666"
- CPF: "11111111111" (CPF inválido - deve mostrar erro)
- Email: "ana@teste.com"
- Senha: "123456"

## Verificação no Banco

Após criar os usuários, verifique no Supabase:

```sql
-- Ver usuários criados
SELECT id, email, full_name, whatsapp, cpf, created_at 
FROM profiles 
ORDER BY created_at DESC;

-- Verificar se as colunas foram criadas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('whatsapp', 'cpf');

-- Verificar CPFs válidos
SELECT full_name, cpf, 
       CASE 
         WHEN cpf ~ '^[0-9]{11}$' THEN 'Formato OK'
         ELSE 'Formato Inválido'
       END as formato_status
FROM profiles 
WHERE cpf IS NOT NULL;
```

## Problemas Comuns e Soluções

### ❌ Erro: "Column 'whatsapp' does not exist"
**Solução**: Execute a migração primeiro (veja MIGRATION_INSTRUCTIONS.md)

### ❌ Erro: "CPF inválido. Verifique o número informado."
**Solução**: Use um CPF válido (veja lista de CPFs válidos acima)

### ❌ Erro: "CPF deve ter 11 dígitos"
**Solução**: Digite exatamente 11 dígitos numéricos

### ❌ Erro: "Invalid CPF format" (no banco)
**Solução**: CPF deve ter exatamente 11 dígitos numéricos

### ❌ Erro: "Invalid WhatsApp format" (no banco)
**Solução**: WhatsApp deve ter 10-11 dígitos numéricos

### ❌ Campo não aparece no formulário
**Solução**: Verifique se está no modo "Criar conta" (não "Fazer login")

### ❌ Botão "Criar conta" fica desabilitado
**Solução**: Digite um CPF válido (o botão só é habilitado com CPF válido)

## Algoritmo de Validação de CPF

O sistema usa o **algoritmo oficial brasileiro** da Receita Federal:

1. **Multiplica os 9 primeiros dígitos** por pesos decrescentes (10 a 2)
2. **Soma os resultados** e calcula o resto da divisão por 11
3. **Calcula o primeiro dígito verificador** (se resto < 2, dígito = 0; senão, dígito = 11 - resto)
4. **Repete o processo** para os 10 primeiros dígitos (incluindo o primeiro verificador)
5. **Calcula o segundo dígito verificador** usando o mesmo método
6. **Compara os dígitos calculados** com os dígitos informados

## Próximos Passos

1. ✅ Execute a migração no Supabase
2. ✅ Teste o cadastro com os novos campos
3. ✅ Teste a validação de CPF com dados válidos e inválidos
4. ✅ Verifique se os dados estão sendo salvos corretamente
5. ✅ Teste o login com usuários criados
6. 🔄 Implemente verificação de WhatsApp via API
7. 🔄 Adicione máscaras de input mais avançadas
8. 🔄 Implemente validação de força da senha 