# 🚀 Guia de Deploy na Vercel - CaptaZap

## 📋 Pré-requisitos

### **1. Conta na Vercel**
- [ ] Criar conta em [vercel.com](https://vercel.com)
- [ ] Conectar com GitHub/GitLab/Bitbucket
- [ ] Instalar Vercel CLI (opcional)

### **2. Repositório Git**
- [ ] Código commitado e pushado
- [ ] Branch principal estável
- [ ] Todas as dependências instaladas

### **3. Variáveis de Ambiente**
- [ ] Configurar Supabase URL e chaves
- [ ] Configurar outras APIs necessárias
- [ ] Testar localmente com `.env`

## 🔧 Configuração Local

### **1. Instalar Vercel CLI (Opcional)**
```bash
npm i -g vercel
```

### **2. Testar Build Localmente**
```bash
# Limpar builds anteriores
rm -rf dist/

# Instalar dependências
npm install

# Testar build
npm run build

# Verificar se dist/ foi criado
ls -la dist/
```

### **3. Verificar Configurações**
- [ ] `vite.config.js` otimizado para produção
- [ ] `vercel.json` configurado corretamente
- [ ] `.gitignore` atualizado
- [ ] Dependências no `package.json`

## 🌐 Deploy na Vercel

### **Opção 1: Deploy via Dashboard (Recomendado)**

#### **Passo 1: Importar Projeto**
1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Clique em "New Project"
3. Importe seu repositório Git
4. Selecione o repositório "mano"

#### **Passo 2: Configurar Projeto**
```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

#### **Passo 3: Configurar Variáveis de Ambiente**
```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_APP_NAME=CaptaZap
VITE_APP_VERSION=1.0.0
```

#### **Passo 4: Deploy**
1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique se não há erros
4. Acesse a URL fornecida

### **Opção 2: Deploy via CLI**

#### **Passo 1: Login**
```bash
vercel login
```

#### **Passo 2: Deploy**
```bash
vercel --prod
```

#### **Passo 3: Configurar Variáveis**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## ⚙️ Configurações Avançadas

### **1. Domínio Customizado**
1. Vá em "Settings" > "Domains"
2. Adicione seu domínio
3. Configure DNS conforme instruções

### **2. Variáveis de Ambiente por Ambiente**
```bash
# Desenvolvimento
vercel env add VITE_SUPABASE_URL development

# Preview
vercel env add VITE_SUPABASE_URL preview

# Produção
vercel env add VITE_SUPABASE_URL production
```

### **3. Configurações de Performance**
- [ ] Enable Edge Functions (se necessário)
- [ ] Configure CDN regions
- [ ] Enable Analytics

## 🧪 Testes Pós-Deploy

### **1. Verificações Básicas**
- [ ] Página carrega sem erros
- [ ] Login/registro funcionando
- [ ] Supabase conectando
- [ ] Responsividade em mobile

### **2. Testes de Funcionalidade**
- [ ] Autenticação funcionando
- [ ] Dashboard carregando
- [ ] Fluxos funcionando
- [ ] Templates funcionando

### **3. Testes de Performance**
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals OK
- [ ] Bundle size otimizado
- [ ] Cache funcionando

## 🚨 Solução de Problemas

### **Erro: Build Failed**
```bash
# Verificar logs
vercel logs

# Testar localmente
npm run build

# Verificar dependências
npm ls
```

### **Erro: Environment Variables**
```bash
# Verificar variáveis
vercel env ls

# Adicionar variáveis
vercel env add NOME_DA_VARIAVEL
```

### **Erro: Supabase Connection**
- [ ] Verificar URL e chaves
- [ ] Verificar CORS no Supabase
- [ ] Verificar políticas RLS

### **Erro: Routing**
- [ ] Verificar `vercel.json`
- [ ] Verificar SPA fallback
- [ ] Verificar redirects

## 📊 Monitoramento

### **1. Vercel Analytics**
- [ ] Enable Analytics
- [ ] Monitorar performance
- [ ] Acompanhar erros

### **2. Logs e Debugging**
```bash
# Ver logs em tempo real
vercel logs --follow

# Ver logs de uma função específica
vercel logs --function=nome-da-funcao
```

### **3. Performance Monitoring**
- [ ] Core Web Vitals
- [ ] Bundle analysis
- [ ] Network requests

## 🔄 Deploy Contínuo

### **1. GitHub Actions (Opcional)**
```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### **2. Auto-Deploy**
- [ ] Enable auto-deploy no Vercel
- [ ] Configurar branch principal
- [ ] Configurar preview deployments

## 📱 Otimizações Pós-Deploy

### **1. Performance**
- [ ] Enable compression
- [ ] Configure caching
- [ ] Optimize images
- [ ] Enable PWA (se necessário)

### **2. SEO**
- [ ] Meta tags configuradas
- [ ] Sitemap gerado
- [ ] Robots.txt configurado
- [ ] Schema markup

### **3. Analytics**
- [ ] Google Analytics
- [ ] Hotjar (se necessário)
- [ ] Error tracking
- [ ] Performance monitoring

## ✅ Checklist Final

### **Antes do Deploy:**
- [ ] Build local funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Supabase configurado
- [ ] Testes passando

### **Durante o Deploy:**
- [ ] Build sem erros
- [ ] Variáveis configuradas
- [ ] Domínio configurado
- [ ] SSL funcionando

### **Após o Deploy:**
- [ ] Página carregando
- [ ] Funcionalidades testadas
- [ ] Performance OK
- [ ] Monitoramento ativo

## 🎯 URLs Importantes

- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Documentação**: [vercel.com/docs](https://vercel.com/docs)
- **CLI**: [vercel.com/docs/cli](https://vercel.com/docs/cli)
- **Analytics**: [vercel.com/analytics](https://vercel.com/analytics)

## 🚀 Próximos Passos

1. **Deploy inicial** na Vercel
2. **Configurar domínio** customizado
3. **Monitorar performance** e erros
4. **Implementar CI/CD** (opcional)
5. **Otimizar** baseado em métricas

---

**🎉 Seu CaptaZap estará rodando na Vercel com performance de produção!**

Para dúvidas ou problemas, consulte:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Supabase Documentation](https://supabase.com/docs) 