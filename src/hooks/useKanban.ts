import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { KANBAN_COLUMNS } from '../types/kanban';
import type { KanbanState, KanbanStatus, KanbanColumn } from '../types/kanban';
import type { EmpresaBanco } from '../services/edgeFunctions';

export function useKanban(empresas: EmpresaBanco[]) {
  const navigate = useNavigate();
  
  // Estado do Kanban - inicializar com colunas vazias
  const [state, setState] = useState<KanbanState>(() => {
    return {
      columns: KANBAN_COLUMNS.reduce((acc, col) => ({
        ...acc,
        [col.id]: { ...col, items: [] }
      }), {} as Record<KanbanStatus, KanbanColumn>),
      empresaStatus: {}
    };
  });

  // Carregar empresas nas colunas baseado no status do banco
  useEffect(() => {
    console.log('🔄 Reorganizando empresas no Kanban com dados do banco...');
    
    setState(currentState => {
      const newState = { ...currentState };
      
      // Limpar todas as colunas
      Object.values(newState.columns).forEach(col => {
        col.items = [];
      });

      // Resetar mapeamento de status
      newState.empresaStatus = {};

      // Distribuir empresas nas colunas baseado no status do banco
      empresas.forEach(empresa => {
        // Usar o status do banco ou padrão 'a_contatar' se não existir
        const status = (empresa.status as KanbanStatus) || 'a_contatar';
        
        // Validar se o status é válido
        if (newState.columns[status]) {
          newState.columns[status].items.push(empresa);
          newState.empresaStatus[empresa.id] = status;
        } else {
          // Se status inválido, colocar em 'a_contatar'
          console.warn(`Status inválido para empresa ${empresa.id}: ${empresa.status}. Movendo para 'a_contatar'`);
          newState.columns['a_contatar'].items.push(empresa);
          newState.empresaStatus[empresa.id] = 'a_contatar';
        }
      });

      console.log('📊 Estado do Kanban atualizado:', {
        a_contatar: newState.columns.a_contatar.items.length,
        contato_realizado: newState.columns.contato_realizado.items.length,
        em_negociacao: newState.columns.em_negociacao.items.length,
        ganhos: newState.columns.ganhos.items.length,
        perdidos: newState.columns.perdidos.items.length
      });

      return newState;
    });
  }, [empresas]);

  // Mover empresa entre colunas
  const moveEmpresa = useCallback(async (empresaId: number, fromStatus: KanbanStatus, toStatus: KanbanStatus) => {
    console.log(`🔄 Movendo empresa ${empresaId} de ${fromStatus} para ${toStatus}`);

    // Atualizar estado local primeiro para responsividade
    setState(currentState => {
      const newState = { ...currentState };
      
      // Encontrar empresa em qualquer coluna
      let empresa: EmpresaBanco | undefined;
      let actualFromStatus = fromStatus;
      
      // Procurar em todas as colunas
      for (const status of Object.keys(newState.columns) as KanbanStatus[]) {
        empresa = newState.columns[status].items.find(e => e.id === empresaId);
        if (empresa) {
          actualFromStatus = status;
          break;
        }
      }

      if (!empresa) {
        console.error(`Empresa ${empresaId} não encontrada em nenhuma coluna`);
        return currentState;
      }

      // Remover da coluna atual
      newState.columns[actualFromStatus].items = newState.columns[actualFromStatus].items.filter(e => e.id !== empresaId);
      
      // Adicionar na nova coluna
      newState.columns[toStatus].items.push(empresa);
      
      // Atualizar status no mapeamento local
      newState.empresaStatus[empresaId] = toStatus;

      return newState;
    });

    // Salvar no banco de dados
    try {
      console.log(`💾 Salvando no banco: empresa ${empresaId} -> status ${toStatus}`);
      
      // Usar o tipo correto do enum do banco
      const { error } = await supabase
        .from('empresas')
        .update({ 
          status: toStatus.toString()
        })
        .eq('id', empresaId);

      if (error) {
        console.error('❌ Erro ao atualizar status no banco:', error);
        alert('Erro ao salvar no banco de dados. Tente novamente.');
      } else {
        console.log(`✅ Status atualizado com sucesso no banco: empresa ${empresaId} -> ${toStatus}`);
      }
    } catch (error) {
      console.error('💥 Erro na requisição de atualização:', error);
    }
  }, []);

  // Função para disparar mensagem - redireciona para página de disparos
  const dispararMensagem = useCallback((empresa: EmpresaBanco) => {
    console.log('🚀 Disparando mensagem para empresa:', empresa.titulo);
    
    // Redirecionar para a página de disparos com dados da empresa
    navigate('/admin/disparos', {
      state: {
        empresaSelecionada: empresa,
        modalidadeSelecionada: empresa.pesquisa || 'todas'
      }
    });
  }, [navigate]);

  return {
    state,
    moveEmpresa,
    dispararMensagem
  };
} 