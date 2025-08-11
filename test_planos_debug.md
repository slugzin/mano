# Debug dos Planos

## 🔍 **Problema Identificado**

Os cards dos planos não estão aparecendo na página, mesmo com dados no banco.

## 📊 **Dados do Banco**

```sql
INSERT INTO "public"."subscription_plans" ("id", "name", "description", "price", "currency", "interval", "features", "limits", "is_active", "created_at", "updated_at") VALUES 
('20c456fd-aef0-4ed4-aad3-5300f55e3481', 'Premium', 'Plano completo para empresas em crescimento', '59.90', 'BRL', 'month', '{"flows": 50, "support": "phone_email", "features": ["Até 10 conexões WhatsApp", "Busca de empresas ilimitada", "Disparos ilimitados", "Templates ilimitados", "Fluxos avançados", "Suporte telefônico e email", "Relatórios avançados", "Integração completa", "API personalizada", "White-label", "Treinamento incluído"], "templates": 100, "companies_per_month": 1000, "dispatches_per_month": 2000, "whatsapp_connections": 10}', '{"max_flows": 50, "max_templates": 100, "max_team_members": 10, "max_companies_per_month": 1000, "max_dispatches_per_month": 2000, "max_whatsapp_connections": 10}', 'true', '2025-08-07 18:52:49.177937+00', '2025-08-07 18:52:49.177937+00'), 
('41be1cd7-8735-403a-a3b4-dd64afe87fbd', 'Gratuito', 'Plano gratuito com funcionalidades básicas', '0.00', 'BRL', 'month', '{"flows": 2, "support": "email", "features": ["Conexão WhatsApp básica", "Busca de empresas limitada", "Disparos básicos", "Templates simples", "Suporte por email"], "templates": 5, "companies_per_month": 50, "dispatches_per_month": 100, "whatsapp_connections": 1}', '{"max_flows": 2, "max_templates": 5, "max_team_members": 1, "max_companies_per_month": 50, "max_dispatches_per_month": 100, "max_whatsapp_connections": 1}', 'true', '2025-08-07 18:52:49.177937+00', '2025-08-07 18:52:49.177937+00'), 
('91ae677b-a986-4c50-a47f-7db68c5bb4d8', 'Básico', 'Plano ideal para pequenas empresas', '29.90', 'BRL', 'month', '{"flows": 10, "support": "priority_email", "features": ["Até 3 conexões WhatsApp", "Busca de empresas ilimitada", "Disparos avançados", "Templates personalizados", "Fluxos de automação", "Suporte prioritário", "Relatórios básicos", "Integração com APIs"], "templates": 20, "companies_per_month": 200, "dispatches_per_month": 500, "whatsapp_connections": 3}', '{"max_flows": 10, "max_templates": 20, "max_team_members": 3, "max_companies_per_month": 200, "max_dispatches_per_month": 500, "max_whatsapp_connections": 3}', 'true', '2025-08-07 18:52:49.177937+00', '2025-08-07 18:52:49.177937+00');
```

## 🛠️ **Correções Implementadas**

### **1. Logs de Debug Adicionados**
```typescript
// No serviço
console.log('🔍 Buscando planos no banco...');
console.log('📊 Dados retornados:', data);
console.log('✅ Planos encontrados:', data?.length || 0);

// Na página
console.log('🔍 Carregando planos...');
console.log('📊 Resultado da busca de planos:', result);
console.log('✅ Planos carregados:', result.data);
```

### **2. Tratamento de Dados Nulos**
```typescript
// Antes
{plan.features.whatsapp_connections}

// Depois
{plan.features?.whatsapp_connections || 0}
```

### **3. Consulta Simplificada**
```typescript
// Removido filtro is_active temporariamente
const { data, error } = await supabase
  .from('subscription_plans')
  .select('*')
  .order('price', { ascending: true });
```

### **4. Debug Visual**
- Botão "Recarregar Planos (Debug)"
- Contador de planos carregados
- Mensagem quando nenhum plano é encontrado

## 🔧 **Como Testar**

### **1. Abrir Console do Navegador**
- F12 → Console
- Verificar logs de debug

### **2. Clicar no Botão Debug**
- "Recarregar Planos (Debug)"
- Verificar contador de planos

### **3. Verificar Logs Esperados**
```
🔍 Carregando planos...
🔍 Buscando planos no banco...
📊 Dados retornados: [Array com 3 planos]
✅ Planos encontrados: 3
📊 Resultado da busca de planos: {success: true, data: [...]}
✅ Planos carregados: [Array com 3 planos]
🎯 Renderizando plano: {id: "...", name: "Gratuito", ...}
```

## 🎯 **Possíveis Problemas**

### **1. RLS (Row Level Security)**
- Políticas podem estar bloqueando acesso
- Verificar se usuário tem permissão

### **2. Estrutura de Dados**
- Campos `features` e `limits` como JSONB
- Pode haver problema de parsing

### **3. Rede/Conectividade**
- Problema de conexão com Supabase
- Timeout na requisição

### **4. Cache do Navegador**
- Dados em cache antigos
- Hard refresh (Ctrl+F5)

## 🚀 **Próximos Passos**

### **1. Se os logs mostrarem dados:**
- Verificar se há erro na renderização
- Verificar se há problema com TypeScript

### **2. Se os logs não mostrarem dados:**
- Verificar RLS policies
- Verificar permissões do usuário
- Testar consulta direta no Supabase

### **3. Se houver erro de rede:**
- Verificar configuração do Supabase
- Verificar variáveis de ambiente

## ✅ **Resultado Esperado**

Após as correções, a página deve mostrar:

1. **3 cards de planos** lado a lado
2. **Gratuito** (R$ 0,00) - Cinza
3. **Básico** (R$ 29,90) - Azul  
4. **Premium** (R$ 59,90) - Roxo com badge "MAIS POPULAR"

Cada card deve mostrar:
- Nome do plano
- Preço
- Lista de recursos
- Botão de ação 