import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const AuthDebugger: React.FC = () => {
  const { user, session, loading, refreshSession, refreshAuth } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`].slice(-20)); // Manter apenas os últimos 20 logs
  };

  const checkAuthStatus = async () => {
    try {
      addLog('🔍 Verificando status de autenticação...');
      
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      
      const info = {
        hasUser: !!user,
        hasSession: !!session,
        hasCurrentSession: !!currentSession,
        loading,
        error: error?.message || null,
        sessionExpiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toLocaleString() : null,
        timeUntilExpiry: currentSession?.expires_at ? Math.floor((currentSession.expires_at * 1000 - Date.now()) / 1000) : null,
        userEmail: user?.email || null,
        userId: user?.id || null
      };
      
      setDebugInfo(info);
      addLog(`✅ Status verificado: ${info.hasUser ? 'Logado' : 'Não logado'}`);
      
    } catch (error) {
      addLog(`❌ Erro ao verificar status: ${error}`);
    }
  };

  const testRefreshSession = async () => {
    try {
      addLog('🔄 Testando refresh da sessão...');
      await refreshSession();
      addLog('✅ Refresh da sessão concluído');
      await checkAuthStatus();
    } catch (error) {
      addLog(`❌ Erro no refresh: ${error}`);
    }
  };

  const testRefreshAuth = async () => {
    try {
      addLog('🔄 Testando refresh auth...');
      const result = await refreshAuth();
      addLog(`✅ Refresh auth: ${result ? 'Sucesso' : 'Falha'}`);
      await checkAuthStatus();
    } catch (error) {
      addLog(`❌ Erro no refresh auth: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [user, session, loading]);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      checkAuthStatus();
    }, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, [isMonitoring]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">🔧 Debug de Autenticação</h2>
      
      <div className="space-y-4">
        {/* Status Atual */}
        <div className="p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">📊 Status Atual</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><strong>Usuário:</strong> {debugInfo.hasUser ? '✅ Logado' : '❌ Não logado'}</div>
            <div><strong>Sessão:</strong> {debugInfo.hasSession ? '✅ Ativa' : '❌ Inativa'}</div>
            <div><strong>Loading:</strong> {debugInfo.loading ? '⏳ Carregando' : '✅ Pronto'}</div>
            <div><strong>Email:</strong> {debugInfo.userEmail || 'N/A'}</div>
            <div><strong>User ID:</strong> {debugInfo.userId || 'N/A'}</div>
            <div><strong>Expira em:</strong> {debugInfo.sessionExpiresAt || 'N/A'}</div>
            <div><strong>Tempo restante:</strong> {debugInfo.timeUntilExpiry ? `${debugInfo.timeUntilExpiry}s` : 'N/A'}</div>
            <div><strong>Erro:</strong> {debugInfo.error || 'Nenhum'}</div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex space-x-2">
          <button
            onClick={checkAuthStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            🔍 Verificar Status
          </button>
          
          <button
            onClick={testRefreshSession}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            🔄 Refresh Session
          </button>
          
          <button
            onClick={testRefreshAuth}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            🔄 Refresh Auth
          </button>
          
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`px-4 py-2 rounded ${
              isMonitoring 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            } text-white`}
          >
            {isMonitoring ? '⏹️ Parar Monitoramento' : '▶️ Iniciar Monitoramento'}
          </button>
          
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            🗑️ Limpar Logs
          </button>
        </div>

        {/* Logs */}
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">📝 Logs</h3>
          <div className="bg-black text-green-400 p-3 rounded text-xs font-mono h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Nenhum log ainda...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Informações de Debug */}
        <div className="p-4 bg-yellow-50 rounded">
          <h3 className="font-semibold mb-2">🐛 Informações de Debug</h3>
          <div className="text-sm space-y-1">
            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            <div><strong>Local Storage:</strong> {localStorage.getItem('admin_logged_in') || 'N/A'}</div>
            <div><strong>Session Storage:</strong> {sessionStorage.length > 0 ? 'Tem dados' : 'Vazio'}</div>
            <div><strong>Online:</strong> {navigator.onLine ? '✅ Online' : '❌ Offline'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger; 