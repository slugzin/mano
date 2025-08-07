#!/usr/bin/env node

/**
 * SCRIPT DE TESTE DE SEGURANÇA
 * 
 * Este script testa vulnerabilidades comuns em aplicações SaaS
 * Execute: node scripts/security-test.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://goqhudvrndtmxhbblrqa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔒 INICIANDO TESTE DE SEGURANÇA...\n');

async function testUnauthorizedAccess() {
  console.log('📋 TESTE 1: Tentativa de acesso não autorizado aos dados\n');
  
  const tests = [
    { table: 'empresas', description: 'Listar todas as empresas' },
    { table: 'conversas', description: 'Listar todas as conversas' },
    { table: 'frases_whatsapp', description: 'Listar frases do WhatsApp' },
    { table: 'disparos_agendados', description: 'Listar disparos agendados' },
    { table: 'campanhas', description: 'Listar campanhas' }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testando: ${test.description}`);
      
      const { data, error } = await supabase
        .from(test.table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`✅ SEGURO: ${test.table} - ${error.message}\n`);
      } else if (data && data.length > 0) {
        console.log(`❌ VULNERÁVEL: ${test.table} - Dados expostos sem autenticação!\n`);
      } else {
        console.log(`✅ SEGURO: ${test.table} - Nenhum dado retornado\n`);
      }
    } catch (err) {
      console.log(`✅ SEGURO: ${test.table} - Erro de acesso: ${err.message}\n`);
    }
  }
}

async function testRPCFunctions() {
  console.log('📋 TESTE 2: Tentativa de acesso a funções RPC sem autenticação\n');
  
  const functions = [
    { name: 'proximo_disparo', description: 'Função de próximo disparo' },
    { name: 'agendar_disparos', params: ['550e8400-e29b-41d4-a716-446655440000', 'teste'], description: 'Função de agendar disparos' },
    { name: 'finalizar_task', params: ['test-id', 'sucesso', 'teste'], description: 'Função de finalizar task' }
  ];

  for (const func of functions) {
    try {
      console.log(`🔍 Testando: ${func.description}`);
      
      let result;
      if (func.params) {
        result = await supabase.rpc(func.name, ...func.params);
      } else {
        result = await supabase.rpc(func.name);
      }

      const { data, error } = result;

      if (error) {
        console.log(`✅ SEGURO: ${func.name} - ${error.message}\n`);
      } else {
        console.log(`❌ VULNERÁVEL: ${func.name} - Função executada sem autenticação!\n`);
      }
    } catch (err) {
      console.log(`✅ SEGURO: ${func.name} - Erro de acesso: ${err.message}\n`);
    }
  }
}

async function testSQLInjection() {
  console.log('📋 TESTE 3: Tentativas de SQL Injection\n');
  
  const injectionTests = [
    "'; DROP TABLE empresas; --",
    "1' OR '1'='1",
    "admin'--",
    "' UNION SELECT * FROM auth.users --"
  ];

  for (const injection of injectionTests) {
    try {
      console.log(`🔍 Testando SQL Injection: ${injection}`);
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('empresa_nome', injection)
        .limit(1);

      if (error) {
        console.log(`✅ SEGURO: Injection bloqueada - ${error.message}\n`);
      } else {
        console.log(`⚠️ VERIFICAR: Injection não causou erro, mas pode estar sendo sanitizada\n`);
      }
    } catch (err) {
      console.log(`✅ SEGURO: Injection causou erro - ${err.message}\n`);
    }
  }
}

async function testDataManipulation() {
  console.log('📋 TESTE 4: Tentativas de manipulação de dados sem autenticação\n');
  
  const manipulationTests = [
    {
      action: 'INSERT',
      table: 'empresas',
      data: { empresa_nome: 'TESTE HACKER', user_id: '550e8400-e29b-41d4-a716-446655440000' }
    },
    {
      action: 'UPDATE',
      table: 'empresas',
      data: { empresa_nome: 'HACKED' },
      filter: { id: 1 }
    },
    {
      action: 'DELETE',
      table: 'empresas',
      filter: { id: 1 }
    }
  ];

  for (const test of manipulationTests) {
    try {
      console.log(`🔍 Testando ${test.action} em ${test.table}`);
      
      let result;
      if (test.action === 'INSERT') {
        result = await supabase.from(test.table).insert(test.data);
      } else if (test.action === 'UPDATE') {
        result = await supabase.from(test.table).update(test.data).eq('id', test.filter.id);
      } else if (test.action === 'DELETE') {
        result = await supabase.from(test.table).delete().eq('id', test.filter.id);
      }

      const { error } = result;

      if (error) {
        console.log(`✅ SEGURO: ${test.action} bloqueado - ${error.message}\n`);
      } else {
        console.log(`❌ VULNERÁVEL: ${test.action} executado sem autenticação!\n`);
      }
    } catch (err) {
      console.log(`✅ SEGURO: ${test.action} causou erro - ${err.message}\n`);
    }
  }
}

async function generateSecurityReport() {
  console.log('📊 RELATÓRIO DE SEGURANÇA\n');
  console.log('='.repeat(50));
  console.log('RECOMENDAÇÕES:');
  console.log('1. ✅ Aplicar migração 048_security_fix_critical.sql');
  console.log('2. ✅ Usar apenas autenticação JWT (sem localStorage)');
  console.log('3. ✅ Monitorar logs de auditoria regularmente');
  console.log('4. ✅ Implementar rate limiting');
  console.log('5. ✅ Configurar CORS adequadamente');
  console.log('6. ✅ Usar HTTPS em produção');
  console.log('7. ✅ Implementar 2FA para admins');
  console.log('='.repeat(50));
}

async function runSecurityTests() {
  try {
    await testUnauthorizedAccess();
    await testRPCFunctions();
    await testSQLInjection();
    await testDataManipulation();
    await generateSecurityReport();
    
    console.log('✅ TESTE DE SEGURANÇA CONCLUÍDO!');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
runSecurityTests(); 