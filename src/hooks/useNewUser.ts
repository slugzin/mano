import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const useNewUser = () => {
  const { user } = useAuth();
  const [isNewUser, setIsNewUser] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkIfNewUser = async () => {
      if (!user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        // Verificar se o usuário tem dados nas principais tabelas
        const [fluxosResult, frasesResult, templatesResult, campanhasResult] = await Promise.all([
          supabase.from('fluxos').select('id').limit(1),
          supabase.from('frases_whatsapp').select('id').limit(1),
          supabase.from('message_templates').select('id').limit(1),
          supabase.from('campanhas_disparo').select('id').limit(1)
        ]);

        // Se não há dados em nenhuma tabela, é um usuário novo
        const hasData = 
          (fluxosResult.data && fluxosResult.data.length > 0) ||
          (frasesResult.data && frasesResult.data.length > 0) ||
          (templatesResult.data && templatesResult.data.length > 0) ||
          (campanhasResult.data && campanhasResult.data.length > 0);

        setIsNewUser(!hasData);
      } catch (error) {
        console.error('Erro ao verificar se é usuário novo:', error);
        setIsNewUser(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkIfNewUser();
  }, [user?.id]);

  return { isNewUser, isChecking };
}; 