# Teste de Webhook Automático

## 🎯 **Funcionalidade Implementada**

Quando uma nova instância WhatsApp for conectada com sucesso (após escanear o QR Code), o sistema automaticamente configura o webhook para receber mensagens.

## 🔧 **Como Funciona**

### **1. Detecção de Conexão Estabelecida**
- Monitora mudanças de status das instâncias
- Detecta quando status muda de `disconnected` para `connected`
- Executa automaticamente após conexão bem-sucedida

### **2. Configuração Automática do Webhook**
- Faz requisição POST para: `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar-webhook/NOME_DA_INSTANCIA`
- Configura webhook para receber eventos `MESSAGES_UPSERT`
- URL do webhook: `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens`

## 📋 **Exemplos de Teste**

### **Teste Manual da Edge Function**

```bash
# Teste direto da edge function
curl -X POST "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar-webhook/Teste%20Instancia" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook": {
      "enabled": true,
      "url": "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens",
      "headers": {
        "autorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM",
        "Content-Type": "application/json"
      },
      "byEvents": false,
      "base64": false,
      "events": [
        "MESSAGES_UPSERT"
      ]
    }
  }'
```

### **Teste com Postman**

1. **Método**: POST
2. **URL**: `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar-webhook/Teste%20Instancia`
3. **Headers**:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM
   Content-Type: application/json
   ```
4. **Body** (JSON):
   ```json
   {
     "webhook": {
       "enabled": true,
       "url": "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens",
       "headers": {
         "autorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM",
         "Content-Type": "application/json"
       },
       "byEvents": false,
       "base64": false,
       "events": [
         "MESSAGES_UPSERT"
       ]
     }
   }
   ```

## 🔍 **Logs Esperados**

### **No Console do Navegador:**
```
🎉 Conexão estabelecida com sucesso!
🔧 Configurando webhook automaticamente para: Nome da Instancia
✅ Webhook configurado com sucesso: { ... }
```

### **No Console da Edge Function:**
```
🔧 Configurando webhook para instância: Nome da Instancia
📡 Fazendo requisição para: https://evolution-api.n8nfluxohot.shop/webhook/set/Nome da Instancia
📦 Body da requisição: { ... }
📥 Resposta recebida: { ... }
📊 Status da resposta: 200
```

## 🚀 **Fluxo Completo**

1. **Usuário cria nova instância** → `createInstance()`
2. **Gera QR Code** → `generateQrCode()`
3. **Usuário escaneia QR Code** → WhatsApp conecta
4. **Sistema detecta conexão** → `loadInstances()` detecta mudança de status
5. **Configura webhook automaticamente** → `configurarWebhookAutomatico()`
6. **Fecha modal de QR Code** → Conexão estabelecida com webhook configurado

## ✅ **Verificação de Funcionamento**

### **1. Verificar se webhook foi configurado:**
```bash
curl -X GET "https://evolution-api.n8nfluxohot.shop/webhook/find/NOME_DA_INSTANCIA" \
  -H "Content-Type: application/json"
```

### **2. Verificar logs da edge function:**
- Acessar Supabase Dashboard
- Ir para Edge Functions
- Verificar logs da função `atualizar-webhook`

### **3. Testar recebimento de mensagens:**
- Enviar mensagem para o WhatsApp conectado
- Verificar se a mensagem chega no webhook: `https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens`

## 🐛 **Possíveis Problemas**

### **1. Erro de Timeout**
- **Causa**: Evolution API demorando para responder
- **Solução**: Timeout de 10 segundos já implementado

### **2. Erro de Autorização**
- **Causa**: Token inválido ou expirado
- **Solução**: Verificar token no header Authorization

### **3. Instância não encontrada**
- **Causa**: Nome da instância incorreto
- **Solução**: Verificar se instância existe na Evolution API

### **4. Webhook já configurado**
- **Causa**: Instância já tem webhook configurado
- **Solução**: A edge function sobrescreve configuração existente 