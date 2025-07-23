import { useState, useEffect } from 'react';

// Cache global para evitar múltiplas requisições
let locationCache: { location: string; timestamp: number } | null = null;
let isLoadingLocation = false;
let locationPromise: Promise<string> | null = null;

const CACHE_DURATION = 3600000; // 1 hora em ms

// Usar ipinfo.io que funcionava perfeitamente antes
const fetchLocation = async (): Promise<string> => {
  console.log('🌍 Detectando cidade do usuário via ipinfo.io...');
  
  try {
    console.log('🔄 Fazendo requisição para ipinfo.io');
    
    const response = await fetch('https://ipinfo.io/json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      console.log(`❌ ipinfo.io retornou status ${response.status}`);
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📡 Dados do ipinfo.io:', data);
    
    if (data.city) {
      const location = data.region ? `${data.city} - ${data.region}` : data.city;
      console.log(`✅ Localização detectada: ${location}`);
      return location;
    }
    
    console.log('⚠️ ipinfo.io não retornou cidade válida');
    throw new Error('Cidade não encontrada');
  } catch (error) {
    console.log(`❌ Erro na API ipinfo.io:`, error);
    // Fallback para São Paulo se falhar
    console.log('⚠️ Usando fallback: São Paulo');
    return 'São Paulo';
  }
};

// Função para atualizar elemento HTML com id="local"
const updateLocalElement = (location: string) => {
  const localElement = document.getElementById('local');
  if (localElement) {
    localElement.textContent = location;
    console.log('📍 Elemento #local atualizado com:', location);
  }
};

// Função para limpar cache e forçar nova detecção
export const clearLocationCache = () => {
  console.log('🗑️ [clearCache] Limpando todos os caches de localização...');
  
  // Limpar cache localStorage
  localStorage.removeItem('userLocation');
  localStorage.removeItem('userLocationTime');
  
  // Limpar cache antigo do Supabase
  localStorage.removeItem('userLocationSupabase');
  localStorage.removeItem('userLocationSupabaseTime');
  
  // Limpar cache global
  locationCache = null;
  
  console.log('✅ [clearCache] Todos os caches limpos! Próxima detecção será nova.');
};

export const useLocation = () => {
  const [userLocation, setUserLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true); // Começar como loading

  const forceRefresh = () => {
    console.log('🔄 Forçando refresh da localização...');
    clearLocationCache();
    getUserLocation();
  };

  const getUserLocation = async () => {
    console.log('🎯 [useLocation] Iniciando detecção de localização...');
    
    // Verificar cache local primeiro
    const cachedLocation = localStorage.getItem('userLocation');
    const cacheTime = localStorage.getItem('userLocationTime');
    const now = Date.now();
    
    // Se temos cache válido, usar ele
    if (cachedLocation && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
      console.log('💾 [useLocation] Usando localização do cache:', cachedLocation);
      setUserLocation(cachedLocation);
      setIsLoading(false);
      updateLocalElement(cachedLocation);
      return;
    }
    
    // Verificar cache global
    if (locationCache && (now - locationCache.timestamp) < CACHE_DURATION) {
      console.log('💾 [useLocation] Usando cache global:', locationCache.location);
      setUserLocation(locationCache.location);
      setIsLoading(false);
      updateLocalElement(locationCache.location);
      return;
    }
    
    // Se já está carregando, aguardar a promessa existente
    if (isLoadingLocation && locationPromise) {
      console.log('⏳ [useLocation] Aguardando requisição em andamento...');
      try {
        const location = await locationPromise;
        setUserLocation(location);
        setIsLoading(false);
        updateLocalElement(location);
      } catch (error) {
        console.error('❌ [useLocation] Erro na requisição em andamento:', error);
        setUserLocation('São Paulo');
        setIsLoading(false);
      }
      return;
    }
    
    // Fazer nova requisição
    console.log('🌍 [useLocation] Fazendo nova requisição...');
    setIsLoading(true);
    isLoadingLocation = true;
    
    locationPromise = fetchLocation();
    
    try {
      const location = await locationPromise;
      console.log('✅ [useLocation] Localização obtida:', location);
      
      // Salvar nos caches
      locationCache = { location, timestamp: now };
      localStorage.setItem('userLocation', location);
      localStorage.setItem('userLocationTime', now.toString());
      
      setUserLocation(location);
      updateLocalElement(location);
    } catch (error) {
      console.error('❌ [useLocation] Erro geral na detecção:', error);
      const fallback = 'São Paulo';
      setUserLocation(fallback);
      updateLocalElement(fallback);
      localStorage.setItem('userLocation', fallback);
      localStorage.setItem('userLocationTime', now.toString());
    } finally {
      setIsLoading(false);
      isLoadingLocation = false;
      locationPromise = null;
    }
  };

  useEffect(() => {
    console.log('🚀 [useLocation] Hook inicializado, detectando localização...');
    
    // Limpar cache antigo do Supabase na primeira execução
    const hasOldCache = localStorage.getItem('userLocationSupabase');
    if (hasOldCache) {
      console.log('🧹 [useLocation] Limpando cache antigo do Supabase...');
      localStorage.removeItem('userLocationSupabase');
      localStorage.removeItem('userLocationSupabaseTime');
    }
    
    getUserLocation();
  }, []);

  return { userLocation, isLoading, forceRefresh };
}; 