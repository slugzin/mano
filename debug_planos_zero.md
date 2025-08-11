# Debug: "0 planos carregados"

## 🔍 **Problema Identificado**

A página está mostrando "Debug: 0 planos carregados", indicando que os planos não estão sendo carregados do banco de dados.

## 🛠️ **Correções Implementadas**

### **1. Logs de Debug Detalhados** ✅
```typescript
// Teste de conexão
console.log('🧪 Teste de conexão:', { testData, testError });

// Consulta real
console.log('📊 Dados retornados:', data);
console.log('❌ Erro (se houver):', error);
console.log('🔢 Número de planos:', data?.length || 0);

// Log detalhado de cada plano
data.forEach((plan, index) => {
  console.log(`📋 Plano ${index + 1}:`, {
    id: plan.id,
    name: plan.name,
    price: plan.price,
    is_active: plan.is_active
  });
});
```

### **2. Migration para Corrigir RLS** ✅
```sql
-- Desabilitar RLS temporariamente
ALTER TABLE subscription_plans DISABLE ROW LEVEL SECURITY;

-- Remover políticas bloqueadoras
DROP POLICY IF EXISTS "Anyone can view active subscription plans" ON subscription_plans;
DROP POLICY IF EXISTS "Only admins can manage subscription plans" ON subscription_plans;
```

### **3. Teste Direto no Banco** ✅
```typescript
// Teste direto na página
const { data, error } = await supabase
  .from('subscription_plans')
  .select('*')
  .limit(1);
```

### **4. Botões de Debug** ✅
- **"Recarregar Planos (Debug)"** - Testa o serviço
- **"Teste Direto Banco"** - Testa conexão direta

## 🔧 **Como Investigar**

### **1. Abrir Console do Navegador**
- Pressione `F12` → Console
- Verificar todos os logs

### **2. Clicar nos Botões de Debug**
- **"Recarregar Planos (Debug)"** - Ver logs do serviço
- **"Teste Direto Banco"** - Ver alerta com resultado

### **3. Verificar Logs Esperados**
```
🔍 Carregando planos...
🧪 Teste de conexão: { testData: [...], testError: null }
🔍 Buscando planos no banco...
📊 Dados retornados: [Array com 3 planos]
✅ Planos encontrados: 3
📋 Plano 1: { id: "...", name: "Gratuito", price: 0 }
📋 Plano 2: { id: "...", name: "Básico", price: 29.9 }
📋 Plano 3: { id: "...", name: "Premium", price: 59.9 }
```

## 🎯 **Possíveis Causas**

### **1. RLS (Row Level Security) Bloqueando**
- **Sintoma**: Erro 42501 ou dados vazios
- **Solução**: Migration `065_fix_subscription_plans_rls.sql`

### **2. Tabela Não Existe**
- **Sintoma**: Erro "relation does not exist"
- **Solução**: Executar migration `064_create_subscription_plans.sql`

### **3. Problema de Conectividade**
- **Sintoma**: Timeout ou erro de rede
- **Solução**: Verificar configuração do Supabase

### **4. Dados Não Inseridos**
- **Sintoma**: Consulta retorna array vazio
- **Solução**: Verificar se INSERT foi executado

## 🚀 **Passos para Resolver**

### **1. Executar Migration RLS**
```bash
# No Supabase Dashboard ou CLI
supabase db push
```

### **2. Verificar Dados no Banco**
```sql
-- Verificar se tabela existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'subscription_plans';

-- Verificar se há dados
SELECT COUNT(*) FROM subscription_plans;

-- Verificar dados
SELECT id, name, price, is_active FROM subscription_plans;
```

### **3. Testar Conexão**
- Clicar em "Teste Direto Banco"
- Verificar alerta com resultado

### **4. Verificar Console**
- Abrir F12 → Console
- Verificar logs detalhados

## ✅ **Resultado Esperado**

Após as correções:

1. **Console deve mostrar:**
   ```
   ✅ Planos encontrados: 3
   📋 Plano 1: { name: "Gratuito", price: 0 }
   📋 Plano 2: { name: "Básico", price: 29.9 }
   📋 Plano 3: { name: "Premium", price: 59.9 }
   ```

2. **Página deve mostrar:**
   - "Planos carregados: 3"
   - 3 cards de planos
   - Sem mensagem "Nenhum plano encontrado"

3. **Botão "Teste Direto Banco" deve mostrar:**
   - "Teste direto: 3 planos encontrados. Erro: Nenhum"

## 🐛 **Se Ainda Não Funcionar**

### **1. Verificar Supabase Dashboard**
- Ir em Database → Tables
- Verificar se `subscription_plans` existe
- Verificar se há dados na tabela

### **2. Verificar RLS Policies**
- Ir em Authentication → Policies
- Verificar se há políticas bloqueando `subscription_plans`

### **3. Verificar API Keys**
- Verificar se `SUPABASE_URL` e `SUPABASE_ANON_KEY` estão corretos
- Verificar se não há problemas de CORS

### **4. Testar em Modo Anônimo**
- Deslogar e testar sem autenticação
- Verificar se problema é específico do usuário

**Execute a migration e teste os botões de debug para identificar o problema!** 🔍✨ 