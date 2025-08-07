# Teste das Edge Functions de Webhook

## 1. Edge Function Simples (Manual)

### URL:
```
https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/configurar-webhook/NOMEDAINSTANCIA
```

### Como usar:
```bash
curl -X POST "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/configurar-webhook/Disparo%20Cilios" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM" \
  -H "Content-Type: application/json"
```

### Funcionalidade:
- Configura webhook para uma instância específica
- Usa o nome da instância na URL
- Retorna a resposta da API de atualização de webhook

## 2. Edge Function Automática (Recomendada)

### URL:
```
https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/configurar-webhook-automatico
```

### Como usar:
```bash
curl -X POST "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/configurar-webhook-automatico" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### Funcionalidade:
- Busca automaticamente todas as instâncias conectadas do usuário
- Configura webhook para todas as instâncias encontradas
- Retorna resultado detalhado de cada configuração

## Configuração do Webhook

### Body da requisição (automático):
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

## Resposta Esperada

### Para função automática:
```json
{
  "message": "Configuração de webhook concluída",
  "results": [
    {
      "instance": "Disparo Cilios",
      "status": 200,
      "response": "Webhook configurado com sucesso"
    }
  ]
}
```

## Logs de Debug

As funções incluem logs detalhados para debug:
- 🔧 Configurando webhook para instância
- 📡 Fazendo requisição para URL
- 📦 Body da requisição
- 📥 Resposta recebida
- 📊 Status da resposta

## Teste no Frontend

Para testar no frontend, você pode adicionar um botão que chama a edge function:

```typescript
const configurarWebhook = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const response = await fetch(
      'https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/configurar-webhook-automatico',
      {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Authorization': `Bearer ${user.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const result = await response.json()
    console.log('Webhook configurado:', result)
  } catch (error) {
    console.error('Erro ao configurar webhook:', error)
  }
}
``` 