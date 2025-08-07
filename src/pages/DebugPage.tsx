import React from 'react';
import JWTDebugger from '../components/debug/JWTDebugger';
import AuthDebugger from '../components/debug/AuthDebugger';

const DebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Página de Debug
          </h1>
          <p className="text-gray-600">
            Use esta página para debugar problemas de autenticação e obter o JWT token necessário para o n8n
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Debug de Autenticação */}
          <div>
            <AuthDebugger />
          </div>
          
          {/* Debug JWT */}
          <div>
            <JWTDebugger />
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">📋 Instruções para n8n</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">1. Obter JWT Token</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Faça login no sistema</li>
                <li>Copie o JWT token mostrado acima</li>
                <li>O token é único para cada usuário</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. Configurar n8n (Método Simples)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>URL: <code className="bg-gray-100 px-1 rounded">https://goqhudvrndtmxhbblrqa.supabase.co/rest/v1/rpc/proximo_disparo_simples</code></li>
                <li>Headers: <code className="bg-gray-100 px-1 rounded">apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM</code></li>
                <li>Método: <code className="bg-gray-100 px-1 rounded">POST</code></li>
                <li>Body: <code className="bg-gray-100 px-1 rounded">{}</code></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">3. Configurar n8n (Método com JWT)</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>URL: <code className="bg-gray-100 px-1 rounded">https://goqhudvrndtmxhbblrqa.supabase.co/rest/v1/rpc/proximo_disparo</code></li>
                <li>Headers: <code className="bg-gray-100 px-1 rounded">Authorization: Bearer SEU_JWT_TOKEN</code></li>
                <li>Método: <code className="bg-gray-100 px-1 rounded">POST</code></li>
                <li>Body: <code className="bg-gray-100 px-1 rounded">{}</code></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">4. Segurança</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>O token expira automaticamente</li>
                <li>Cada usuário só acessa seus próprios disparos</li>
                <li>Usuários anônimos são bloqueados</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">5. Exemplo de Resposta</h3>
              <div className="bg-gray-100 p-3 rounded text-xs">
                <pre>{`[
  {
    "id_disparo": 123,
    "empresa_nome_disparo": "Empresa Exemplo",
    "empresa_telefone_disparo": "5511999999999@s.whatsapp.net",
    "mensagem_disparo": "Olá! Como posso ajudar?",
    "status_disparo": "processando",
    "agendado_para_disparo": "2025-08-06T14:30:00",
    ...
  }
]`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage; 