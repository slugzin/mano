# 🔤 Variáveis de Mensagem WhatsApp - CaptaZap

## 🎯 Objetivo

**Processar variáveis dinâmicas** nas mensagens do WhatsApp, substituindo automaticamente placeholders pelos dados reais de cada empresa antes do envio.

## ✅ Problema Identificado

**Antes**: As variáveis como `{empresa_nome}` não eram processadas e apareciam literalmente nas mensagens enviadas.

**Depois**: A função RPC `agendar_disparos` agora processa todas as variáveis antes de inserir na tabela `disparos_agendados`.

## 🔧 Solução Implementada

### **Processamento de Variáveis na Função RPC:**
```sql
-- PROCESSAR VARIÁVEIS DA MENSAGEM PARA ESTA EMPRESA ESPECÍFICA
v_mensagem_processada := p_mensagem;

-- Substituir variáveis comuns
v_mensagem_processada := replace(v_mensagem_processada, '{empresa}', COALESCE(v_empresa.nome, 'Empresa ' || v_empresa.id::TEXT));
v_mensagem_processada := replace(v_mensagem_processada, '{empresa_nome}', COALESCE(v_empresa.nome, 'Empresa ' || v_empresa.id::TEXT));

-- Substituir variáveis de categoria
IF v_empresa.categoria IS NOT NULL THEN
    v_mensagem_processada := replace(v_mensagem_processada, '{categoria}', v_empresa.categoria);
    v_mensagem_processada := replace(v_mensagem_processada, '{empresa_categoria}', v_empresa.categoria);
END IF;

-- E assim por diante para todas as variáveis...
```

## 📋 Variáveis Disponíveis

### **1. Informações Básicas da Empresa:**
```
{empresa}           → Nome da empresa (ex: "Droga Raia")
{empresa_nome}      → Nome da empresa (ex: "Droga Raia")
{empresa_id}        → ID da empresa (ex: "123")
```

### **2. Informações de Contato:**
```
{telefone}          → Telefone da empresa (ex: "(41) 99141-5223")
{empresa_telefone}  → Telefone da empresa (ex: "(41) 99141-5223")
{website}           → Website da empresa (ex: "www.drogaria.com")
{empresa_website}   → Website da empresa (ex: "www.drogaria.com")
```

### **3. Informações de Localização:**
```
{endereco}          → Endereço completo (ex: "Rua das Flores, 123 - Centro, Curitiba - PR")
{empresa_endereco}  → Endereço completo (ex: "Rua das Flores, 123 - Centro, Curitiba - PR")
{cidade}            → Cidade extraída do endereço (ex: "Curitiba")
{empresa_cidade}    → Cidade extraída do endereço (ex: "Curitiba")
```

### **4. Informações de Avaliação:**
```
{avaliacao}         → Avaliação no Google (ex: "4.2")
{empresa_avaliacao} → Avaliação no Google (ex: "4.2")
{posicao}           → Posição no Google (ex: "5")
{empresa_posicao}   → Posição no Google (ex: "5")
```

### **5. Informações de Categoria:**
```
{categoria}         → Categoria da empresa (ex: "Farmácia")
{empresa_categoria} → Categoria da empresa (ex: "Farmácia")
```

## 💡 Exemplos de Uso

### **Exemplo 1: Mensagem Personalizada:**
```
Template: "Boa tarde, falo com a {empresa_nome}?"

Resultado para "Droga Raia": "Boa tarde, falo com a Droga Raia?"
Resultado para "Farmácia Popular": "Boa tarde, falo com a Farmácia Popular?"
```

### **Exemplo 2: Mensagem com Múltiplas Variáveis:**
```
Template: "Olá {empresa_nome}! Vi que vocês são uma {categoria} em {cidade} com avaliação {avaliacao}⭐"

Resultado: "Olá Droga Raia! Vi que vocês são uma Farmácia em Curitiba com avaliação 4.2⭐"
```

### **Exemplo 3: Mensagem com Endereço:**
```
Template: "Gostaria de saber mais sobre {empresa_nome} localizada em {endereco}"

Resultado: "Gostaria de saber mais sobre Droga Raia localizada em Rua das Flores, 123 - Centro, Curitiba - PR"
```

### **Exemplo 4: Mensagem com Website:**
```
Template: "Oi {empresa_nome}! Vi o site {website} e gostei muito!"

Resultado: "Oi Droga Raia! Vi o site www.drogaria.com e gostei muito!"
```

## 🔄 Como Funciona o Processamento

### **1. Fluxo de Substituição:**
```
Mensagem Original → Busca dados da empresa → Substitui variáveis → Salva mensagem processada
```

### **2. Ordem de Processamento:**
1. **Carrega dados** da empresa específica
2. **Inicia com mensagem original** (ex: "Olá {empresa_nome}!")
3. **Substitui cada variável** pelos dados reais
4. **Salva mensagem processada** na tabela `disparos_agendados`

### **3. Tratamento de Valores Nulos:**
- **Se categoria for NULL**: `{categoria}` permanece como `{categoria}`
- **Se endereço for NULL**: `{endereco}` permanece como `{endereco}`
- **Se avaliação for NULL**: `{avaliacao}` permanece como `{avaliacao}`

## 🚀 Benefícios da Implementação

### **1. Personalização Automática:**
- **Cada empresa recebe** uma mensagem personalizada
- **Dados reais** são inseridos automaticamente
- **Sem necessidade** de digitar manualmente

### **2. Flexibilidade:**
- **Múltiplas variáveis** disponíveis
- **Combinações ilimitadas** de mensagens
- **Fácil manutenção** dos templates

### **3. Consistência:**
- **Mesmo template** para todas as empresas
- **Dados sempre atualizados** da tabela empresas
- **Formato padronizado** das mensagens

## 🧪 Como Testar

### **1. Criar Template com Variáveis:**
```
"Olá {empresa_nome}! Vi que vocês são uma {categoria} em {cidade} com avaliação {avaliacao}⭐"
```

### **2. Agendar Disparo:**
- Selecione empresas com dados completos
- Use o template acima
- Execute o disparo

### **3. Verificar Resultado:**
- Vá para a página de histórico
- Clique na empresa para ver a conversa
- A mensagem deve mostrar os dados reais da empresa

### **4. Verificar no Banco:**
```sql
SELECT empresa_nome, mensagem 
FROM disparos_agendados 
WHERE mensagem LIKE '%Droga Raia%';
```

## 🔍 Verificação no Banco de Dados

### **Antes (Variáveis não processadas):**
```sql
SELECT empresa_nome, mensagem FROM disparos_agendados LIMIT 1;
-- Resultado: "Olá {empresa_nome}! Vi que vocês são uma {categoria}..."
```

### **Depois (Variáveis processadas):**
```sql
SELECT empresa_nome, mensagem FROM disparos_agendados LIMIT 1;
-- Resultado: "Olá Droga Raia! Vi que vocês são uma Farmácia em Curitiba com avaliação 4.2⭐"
```

## ⚠️ Considerações Importantes

### **1. Performance:**
- **Processamento individual** para cada empresa
- **Substituição em tempo real** durante o agendamento
- **Sem impacto** no envio das mensagens

### **2. Validação:**
- **Variáveis inexistentes** permanecem inalteradas
- **Dados nulos** não causam erro
- **Fallback** para valores padrão quando necessário

### **3. Manutenção:**
- **Novas variáveis** podem ser adicionadas facilmente
- **Lógica centralizada** na função RPC
- **Fácil debugging** e monitoramento

## 🔄 Próximas Melhorias

### **Funcionalidades Futuras:**
- [ ] **Variáveis condicionais** (ex: {if:categoria:Farmácia}texto{/if})
- [ ] **Variáveis de data** (ex: {data_atual}, {dia_semana})
- [ ] **Variáveis de usuário** (ex: {usuario_nome}, {empresa_usuario})
- [ ] **Variáveis de campanha** (ex: {campanha_nome}, {campanha_data})

### **Otimizações:**
- [ ] **Cache de templates** processados
- [ ] **Validação de variáveis** antes do processamento
- [ ] **Log de substituições** para debugging
- [ ] **Preview de mensagens** antes do envio

## ✅ Status da Implementação

- [x] **Função RPC corrigida** para processar variáveis
- [x] **Todas as variáveis principais** implementadas
- [x] **Processamento automático** durante agendamento
- [x] **Tratamento de valores nulos** implementado
- [x] **Documentação completa** criada
- [x] **Exemplos práticos** fornecidos

## 🎯 Resultado Final

Agora as **variáveis de mensagem funcionam perfeitamente** no CaptaZap:

1. **🔤 Variáveis são processadas** automaticamente
2. **📝 Cada empresa recebe** mensagem personalizada
3. **🎯 Dados reais** são inseridos nas mensagens
4. **⚡ Processamento** acontece durante o agendamento
5. **📱 Mensagens** ficam prontas para envio

---

**🎉 Variáveis de mensagem implementadas com sucesso!**

Agora você pode usar templates como "Olá {empresa_nome}!" e as mensagens serão automaticamente personalizadas para cada empresa! ✨🔤📱

Teste criando um disparo com variáveis e veja a mágica acontecer! 🚀✨ 