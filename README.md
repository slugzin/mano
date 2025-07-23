# Prospect CRM

Uma plataforma moderna de lead generation e automação de mensagens WhatsApp para empresas que querem encontrar novos clientes de forma eficiente.

## 🚀 Funcionalidades

- **Busca Automatizada de Leads**: Encontre empresas e estabelecimentos automaticamente
- **CRM Visual**: Organize leads em um sistema Kanban moderno
- **Integração WhatsApp**: Envie mensagens em massa personalizadas
- **Dashboard em Tempo Real**: Métricas e analytics detalhados
- **Interface Moderna**: Design inspirado no Spotify/Netflix

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (serverless)
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (Supabase)
- **Deployment**: Netlify/Vercel

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd prospect-crm
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 🎯 Como usar

1. **Cadastro**: Faça login na plataforma
2. **Busca**: Digite o tipo de empresa que procura (ex: "barbearias em São Paulo")
3. **Organização**: Organize os leads encontrados no CRM visual
4. **Campanhas**: Crie mensagens personalizadas para WhatsApp
5. **Análise**: Acompanhe métricas e resultados no dashboard

## 🔧 Configuração

### Supabase Setup
1. Crie um projeto no [Supabase](https://supabase.com)
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### WhatsApp Integration
1. Configure webhook para receber mensagens
2. Implemente API para envio de mensagens

## 📱 Demonstração

Acesse: [https://prospect-crm.netlify.app](https://prospect-crm.netlify.app)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Faça commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🎨 Design System

- **Cores primárias**: Azul e Roxo
- **Tipografia**: Inter/System fonts
- **Espaçamento**: Tailwind spacing scale
- **Componentes**: Modular e reutilizáveis

## 📊 Métricas

- Taxa de conversão de leads
- Tempo médio de resposta
- Número de mensagens enviadas
- Leads qualificados por campanha

---

Feito com ❤️ para revolucionar a prospecção de leads. 