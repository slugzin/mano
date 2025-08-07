import React, { useState, useEffect } from 'react';
import { getJWTToken, getUserInfo, testAuthentication } from '../../utils/auth';

const JWTDebugger: React.FC = () => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJWTInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = await getJWTToken();
      const info = await getUserInfo();
      const testResult = await testAuthentication();
      
      setJwtToken(token);
      setUserInfo(info);
      
      console.log('🔍 Debug JWT:', {
        token: token ? `${token.substring(0, 50)}...` : null,
        userInfo: info,
        testResult
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJWTInfo();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Token copiado para a área de transferência!');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">🔑 Debug JWT Token</h2>
      
      <div className="space-y-4">
        {/* Status de Autenticação */}
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Status de Autenticação</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${jwtToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{jwtToken ? '✅ Autenticado' : '❌ Não autenticado'}</span>
          </div>
        </div>

        {/* Informações do Usuário */}
        {userInfo && (
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-semibold mb-2">👤 Informações do Usuário</h3>
            <div className="space-y-1 text-sm">
              <div><strong>ID:</strong> {userInfo.user_id}</div>
              <div><strong>Email:</strong> {userInfo.email}</div>
              <div><strong>Role:</strong> {userInfo.role}</div>
            </div>
          </div>
        )}

        {/* JWT Token */}
        {jwtToken && (
          <div className="p-4 bg-yellow-50 rounded">
            <h3 className="font-semibold mb-2">🔐 JWT Token</h3>
            <div className="space-y-2">
              <div className="text-xs bg-gray-100 p-2 rounded break-all">
                {jwtToken.substring(0, 100)}...
              </div>
              <button
                onClick={() => copyToClipboard(jwtToken)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                📋 Copiar Token
              </button>
            </div>
          </div>
        )}

        {/* Headers para n8n */}
        {jwtToken && (
          <div className="p-4 bg-green-50 rounded">
            <h3 className="font-semibold mb-2">⚙️ Headers para n8n</h3>
            <div className="space-y-2">
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Authorization:</strong> Bearer {jwtToken.substring(0, 50)}...
              </div>
              <div className="text-xs bg-gray-100 p-2 rounded">
                <strong>Content-Type:</strong> application/json
              </div>
            </div>
          </div>
        )}

        {/* Botão de Refresh */}
        <div className="flex space-x-2">
          <button
            onClick={fetchJWTInfo}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '🔄 Carregando...' : '🔄 Atualizar'}
          </button>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-4 bg-red-50 rounded">
            <h3 className="font-semibold text-red-800 mb-2">❌ Erro</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Instruções */}
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">📋 Como usar no n8n</h3>
          <div className="text-sm space-y-2">
            <p>1. <strong>Faça login</strong> no sistema</p>
            <p>2. <strong>Copie o JWT token</strong> acima</p>
            <p>3. <strong>No n8n</strong>, adicione o header:</p>
            <div className="bg-gray-100 p-2 rounded text-xs">
              Authorization: Bearer SEU_JWT_TOKEN_AQUI
            </div>
            <p>4. <strong>URL da função:</strong></p>
            <div className="bg-gray-100 p-2 rounded text-xs">
              https://goqhudvrndtmxhbblrqa.supabase.co/rest/v1/rpc/proximo_disparo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JWTDebugger; 