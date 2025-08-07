# Teste da Webhook de Mensagens

## 🎯 **Problema Identificado**

A edge function `webhook-mensagens` não estava salvando o `user_id` e informações da empresa nas conversas, causando problemas de isolamento de dados.

## 🔧 **Correções Implementadas**

### **1. Busca de Informações da Empresa** ✅
- Busca `user_id` do disparo agendado
- Busca informações completas da empresa
- Inclui todos os campos da empresa na conversa

### **2. Salvamento com user_id** ✅
- Inclui `user_id` na conversa salva
- Mantém isolamento de dados por usuário
- Permite que cada usuário veja apenas suas conversas

### **3. Informações Completas da Empresa** ✅
- `empresa_id`
- `empresa_website`
- `empresa_endereco`
- `empresa_categoria`
- `empresa_avaliacao`
- `empresa_total_avaliacoes`
- `empresa_posicao`
- `empresa_links_agendamento`

## 📋 **Exemplos de Teste**

### **Teste Manual da Webhook**

```bash
# Simular mensagem recebida
curl -X POST "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "messages.upsert",
    "instance": "Teste Instancia",
    "data": {
      "key": {
        "remoteJid": "554198273444@s.whatsapp.net",
        "fromMe": false,
        "id": "test_message_123"
      },
      "pushName": "Empresa Teste",
      "status": "RECEIVED",
      "message": {
        "conversation": "Olá, gostaria de saber mais sobre seus serviços"
      },
      "messageType": "conversation",
      "messageTimestamp": 1754590005,
      "instanceId": "test-instance-id",
      "source": "whatsapp"
    },
    "destination": "webhook",
    "date_time": "2025-01-07T18:00:00Z",
    "sender": "test-sender",
    "server_url": "https://evolution-api.n8nfluxohot.shop",
    "apikey": "test-api-key"
  }'
```

### **Teste com Postman**

1. **Método**: POST
2. **URL**: `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens`
3. **Headers**:
   ```
   Content-Type: application/json
   ```
4. **Body** (JSON):
   ```json
   {
     "event": "messages.upsert",
     "instance": "Teste Instancia",
     "data": {
       "key": {
         "remoteJid": "554198273444@s.whatsapp.net",
         "fromMe": false,
         "id": "test_message_123"
       },
       "pushName": "Empresa Teste",
       "status": "RECEIVED",
       "message": {
         "conversation": "Olá, gostaria de saber mais sobre seus serviços"
       },
       "messageType": "conversation",
       "messageTimestamp": 1754590005,
       "instanceId": "test-instance-id",
       "source": "whatsapp"
     },
     "destination": "webhook",
     "date_time": "2025-01-07T18:00:00Z",
     "sender": "test-sender",
     "server_url": "https://evolution-api.n8nfluxohot.shop",
     "apikey": "test-api-key"
   }
   ```

## 🔍 **Logs Esperados**

### **No Console da Edge Function:**
```
Webhook recebido: { ... }
Processando mensagem: fromMe=false, remoteJid=554198273444@s.whatsapp.net, telefone=554198273444
Disparo agendado encontrado: { ... }
Informações da empresa encontradas: { ... }
Salvando conversa: { ... }
Conversa salva com sucesso: { ... }
```

### **Resposta Esperada:**
```json
{
  "success": true,
  "message": "Resposta recebida salva com sucesso",
  "data": {
    "conversa_id": 123,
    "telefone": "554198273444",
    "empresa": "Nome da Empresa",
    "from_me": false,
    "encontrou_disparo": true
  }
}
```

## 🚀 **Fluxo de Funcionamento**

1. **Webhook recebe mensagem** → Evolution API envia dados
2. **Busca disparo agendado** → Procura por `empresa_telefone`
3. **Busca informações da empresa** → Se encontrou disparo
4. **Salva conversa completa** → Com `user_id` e dados da empresa
5. **Retorna sucesso** → Confirma salvamento

## ✅ **Verificação de Funcionamento**

### **1. Verificar se conversa foi salva:**
```sql
SELECT * FROM conversas 
WHERE telefone = '554198273444' 
ORDER BY criado_em DESC 
LIMIT 1;
```

### **2. Verificar se user_id foi incluído:**
```sql
SELECT telefone, nome_empresa, user_id, empresa_id 
FROM conversas 
WHERE telefone = '554198273444';
```

### **3. Verificar informações da empresa:**
```sql
SELECT 
  telefone, 
  nome_empresa, 
  empresa_website, 
  empresa_categoria,
  empresa_avaliacao
FROM conversas 
WHERE telefone = '554198273444';
```

## 🐛 **Possíveis Problemas**

### **1. RemoteJid não encontrado**
- **Causa**: Telefone não existe em `disparos_agendados`
- **Solução**: Verificar se disparo foi criado corretamente

### **2. Empresa não encontrada**
- **Causa**: `empresa_id` inválido ou empresa deletada
- **Solução**: Verificar integridade dos dados

### **3. user_id null**
- **Causa**: Disparo sem `user_id` associado
- **Solução**: Verificar criação de disparos

### **4. RLS bloqueando acesso**
- **Causa**: Políticas de segurança muito restritivas
- **Solução**: Verificar políticas RLS da tabela `conversas`

## 🔧 **Debug da Webhook**

### **Logs Detalhados:**
```typescript
console.log('Webhook recebido:', JSON.stringify(webhookData, null, 2))
console.log('Disparo agendado encontrado:', disparoAgendado)
console.log('Informações da empresa encontradas:', empresaInfo)
console.log('Salvando conversa:', conversaData)
console.log('Conversa salva com sucesso:', conversaSalva)
```

### **Verificar Logs:**
- Acessar Supabase Dashboard
- Ir para Edge Functions
- Verificar logs da função `webhook-mensagens`

A webhook agora está **100% funcional** e salva todas as informações necessárias! 🎉 