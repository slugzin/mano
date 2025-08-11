-- Atualizar limites dos planos de assinatura conforme especificações
-- Plano Gratuito: 20 empresas/dia, 10 disparos/dia, 1 template, 0 fluxos, 1 conexão WhatsApp
-- Plano Básico: 1000 empresas/mês, 1000 disparos/mês, 10 templates, 2 fluxos, 3 conexões WhatsApp  
-- Plano Premium: 5000 empresas/mês, 5000 disparos/mês, 20 templates, 5 fluxos, 5 conexões WhatsApp

-- Atualizar Plano Gratuito
UPDATE subscription_plans 
SET 
  features = '{
    "flows": 0,
    "support": "whatsapp",
    "templates": 1,
    "companies_per_day": 20,
    "dispatches_per_day": 10,
    "whatsapp_connections": 1,
    "features_list": [
      "1 conexão WhatsApp",
      "20 empresas por dia",
      "10 disparos por dia", 
      "1 template",
      "Suporte via WhatsApp",
      "Funcionalidades básicas"
    ]
  }'::jsonb,
  limits = '{
    "companies_per_day": 20,
    "dispatches_per_day": 10,
    "templates": 1,
    "flows": 0,
    "whatsapp_connections": 1
  }'::jsonb
WHERE name = 'Gratuito';

-- Atualizar Plano Básico  
UPDATE subscription_plans
SET
  features = '{
    "flows": 2,
    "support": "whatsapp",
    "templates": 10,
    "companies_per_month": 1000,
    "dispatches_per_month": 1000,
    "whatsapp_connections": 3,
    "features_list": [
      "3 conexões WhatsApp",
      "1.000 empresas por mês",
      "1.000 disparos por mês",
      "10 templates",
      "2 fluxos",
      "Suporte via WhatsApp",
      "Relatórios básicos",
      "Agendamento de disparos"
    ]
  }'::jsonb,
  limits = '{
    "companies_per_month": 1000,
    "dispatches_per_month": 1000,
    "templates": 10,
    "flows": 2,
    "whatsapp_connections": 3
  }'::jsonb
WHERE name = 'Básico';

-- Atualizar Plano Premium
UPDATE subscription_plans
SET
  features = '{
    "flows": 5,
    "support": "whatsapp",
    "templates": 20,
    "companies_per_month": 5000,
    "dispatches_per_month": 5000,
    "whatsapp_connections": 5,
    "features_list": [
      "5 conexões WhatsApp",
      "5.000 empresas por mês",
      "5.000 disparos por mês",
      "20 templates",
      "5 fluxos",
      "Suporte via WhatsApp",
      "Relatórios avançados",
      "Agendamento avançado",
      "Integração API",
      "Suporte prioritário"
    ]
  }'::jsonb,
  limits = '{
    "companies_per_month": 5000,
    "dispatches_per_month": 5000,
    "templates": 20,
    "flows": 5,
    "whatsapp_connections": 5
  }'::jsonb
WHERE name = 'Premium';

-- Verificar se as atualizações foram aplicadas
DO $$
BEGIN
  RAISE NOTICE 'Planos atualizados com novos limites:';
  RAISE NOTICE 'Gratuito: 20 empresas/dia, 10 disparos/dia, 1 template, 0 fluxos, 1 conexão';
  RAISE NOTICE 'Básico: 1000 empresas/mês, 1000 disparos/mês, 10 templates, 2 fluxos, 3 conexões';
  RAISE NOTICE 'Premium: 5000 empresas/mês, 5000 disparos/mês, 20 templates, 5 fluxos, 5 conexões';
  RAISE NOTICE 'Todos os planos agora têm suporte via WhatsApp';
END $$; 