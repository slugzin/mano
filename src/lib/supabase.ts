import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://goqhudvrndtmxhbblrqa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Configurar persistência da sessão
    persistSession: true,
    // Configurar storage para localStorage
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    // Configurar auto refresh token
    autoRefreshToken: true,
    // Detectar mudanças de sessão automaticamente
    detectSessionInUrl: true,
    // Configurar tempo de expiração do refresh token (em segundos)
    flowType: 'pkce'
  },
  // Configurar timeout para requisições
  global: {
    headers: {
      'X-Client-Info': 'prospect-crm'
    }
  }
});