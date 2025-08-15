import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Trash2 } from 'lucide-react';
import { 
  Phone, 
  X,
  RefreshCw,
  Plus,
  XCircle,
  CheckCircle,
  MessageCircle,
  Settings
} from '../../utils/icons';
import { whatsappService, WhatsAppInstance } from '../../services/whatsappService';

import PageHeader from '../../components/ui/PageHeader';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';

const ConexoesPage: React.FC = () => {
  const { canPerformAction, setShowUpgradeModal, setUpgradeReason, refreshLimits } = usePlanLimits();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [qrCodeExpired, setQrCodeExpired] = useState(false);
  const [isGeneratingNewQr, setIsGeneratingNewQr] = useState(false);
  const [isGeneratingInitialQr, setIsGeneratingInitialQr] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshTimer, setAutoRefreshTimer] = useState<NodeJS.Timeout | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(20);

  // Carregar instâncias do banco de dados
  useEffect(() => {
    loadInstances();
  }, []);

  // Removido - não é mais necessário sem dropdown

  // Limpar estilo do menu mobile quando modal fechar
  useEffect(() => {
    if (!showQrModal) {
      const styleElement = document.querySelector('style');
      if (styleElement && styleElement.textContent?.includes('nav.md\\:hidden')) {
        styleElement.remove();
      }
    }
  }, [showQrModal]);

  // Timer para detectar quando o QR code expirou (2 minutos)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (showQrModal && selectedInstance && selectedInstance.qrCode && !qrCodeExpired) {
      // QR code expira em 2 minutos (120 segundos)
      timer = setTimeout(() => {
        setQrCodeExpired(true);
        console.log('⏰ QR Code expirou automaticamente');
      }, 120000); // 2 minutos
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showQrModal, selectedInstance, qrCodeExpired]);

  // Resetar estado de expiração quando abrir novo modal
  useEffect(() => {
    if (showQrModal) {
      setQrCodeExpired(false);
      setError(null);
    }
  }, [showQrModal]);

  // Timer automático para regenerar QR Code a cada 20 segundos
  useEffect(() => {
    if (showQrModal && selectedInstance) {
      // Iniciar countdown
      setSecondsUntilRefresh(20);
      
      // Timer para contagem regressiva (atualiza a cada segundo)
      const countdownTimer = setInterval(() => {
        setSecondsUntilRefresh(prev => {
          if (prev <= 1) {
            return 20; // Reset para 20 quando chegar em 0
          }
          return prev - 1;
        });
      }, 1000);

      // Timer para regenerar QR Code a cada 20 segundos
      const refreshTimer = setInterval(() => {
        if (selectedInstance) {
          console.log('🔄 Auto-regenerando QR Code...');
          handleGenerateQrCodeForInstance(selectedInstance);
        }
      }, 20000); // 20 segundos

      setAutoRefreshTimer(refreshTimer);

      // Cleanup ao fechar modal
      return () => {
        clearInterval(countdownTimer);
        clearInterval(refreshTimer);
        setAutoRefreshTimer(null);
      };
    }
  }, [showQrModal, selectedInstance]);

  // Limpar timer quando modal fechar
  useEffect(() => {
    if (!showQrModal && autoRefreshTimer) {
      clearInterval(autoRefreshTimer);
      setAutoRefreshTimer(null);
      setSecondsUntilRefresh(20);
    }
  }, [showQrModal, autoRefreshTimer]);

  const loadInstances = async () => {
    setIsLoadingInstances(true);
    console.log('🔄 Carregando conexões do banco de dados...');
    
    const result = await whatsappService.listInstances();
    
    if (result.success && result.data) {
      const newInstances = result.data;
      
      console.log('🔍 Debug - Instâncias carregadas:', newInstances.map(inst => ({ name: inst.name, status: inst.status })));
      console.log('🔍 Debug - Total de instâncias conectadas:', newInstances.filter(inst => inst.status === 'connected').length);
      
      // Verificar se alguma instância mudou de status para conectada
      if (selectedInstance && showQrModal) {
        const updatedInstance = newInstances.find(inst => inst.id === selectedInstance.id);
        if (updatedInstance && updatedInstance.status === 'connected' && selectedInstance.status !== 'connected') {
          console.log('🎉 Conexão estabelecida com sucesso!');
          
          // Configurar webhook automaticamente
          await configurarWebhookAutomatico(updatedInstance.name);
          
          // Fechar modal de QR Code automaticamente
          setTimeout(() => {
            setShowQrModal(false);
            setSelectedInstance(null);
          }, 1000);
        }
      }
      
      setInstances(newInstances);
    } else {
      console.error('❌ Erro ao carregar conexões:', result.error);
      setInstances([]);
    }
    setIsLoadingInstances(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log('🔄 Atualizando status das conexões...');
      
      // Pegar o email do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        console.error('❌ Usuário não está logado');
        return;
      }
      
      console.log('📧 Email do usuário:', user.email);
      
      // Fazer requisição para atualizar status das conexões
      const response = await fetch('https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: user.email
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dados recebidos da API:', result);
        
        if (result.success) {
          console.log(`🎉 ${result.message}`);
          console.log(`📊 ${result.updated} de ${result.found} conexões atualizadas`);
          
          // Recarregar a lista de conexões para mostrar os status atualizados
          await loadInstances();
          
          // Mostrar feedback visual
          setUpdateMessage(`🎉 ${result.updated} conexão(ões) atualizada(s)!`);
          
          // Limpar mensagem após 3 segundos
          setTimeout(() => setUpdateMessage(null), 3000);
        } else {
          console.error('❌ Erro na resposta:', result.error);
          setUpdateMessage(`❌ Erro: ${result.error}`);
          setTimeout(() => setUpdateMessage(null), 3000);
        }
      } else {
        console.error('❌ Erro na requisição de atualização:', response.status);
      }
      
      console.log('🔄 Atualização concluída!');
    } catch (error) {
      console.error('💥 Erro ao atualizar status:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleCheckConnection = async () => {
    if (!selectedInstance) return;
    
    setIsRefreshing(true);
    
    try {
      console.log('🔄 Verificando status da conexão...');
      
      // Pegar o email do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        console.error('❌ Usuário não está logado');
        return;
      }
      
      console.log('📧 Email do usuário:', user.email);
      
      // Fazer requisição para verificar status da conexão
      const response = await fetch('https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: user.email
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Dados recebidos da API:', result);
        
        if (result.success) {
          console.log(`🎉 ${result.message}`);
          
          // Recarregar a lista de conexões para verificar se esta instância foi conectada
          await loadInstances();
          
          // Verificar se a instância atual foi conectada
          const { data: updatedInstance } = await supabase
            .from('whatsapp_instances')
            .select('status')
            .eq('instance_id', selectedInstance.instanceId)
            .eq('user_id', user.id)
            .single();
          
          if (updatedInstance?.status === 'connected') {
            setUpdateMessage('🎉 WhatsApp conectado com sucesso!');
            setShowQrModal(false); // Fechar o modal se conectou
          } else {
            setUpdateMessage('📱 Ainda não detectamos a conexão. Tente novamente em alguns segundos.');
          }
          
          // Limpar mensagem após 3 segundos
          setTimeout(() => setUpdateMessage(null), 3000);
        } else {
          console.error('❌ Erro na resposta:', result.error);
          setUpdateMessage(`❌ Erro: ${result.error}`);
          setTimeout(() => setUpdateMessage(null), 3000);
        }
      } else {
        console.error('❌ Erro na requisição de verificação:', response.status);
        setUpdateMessage('❌ Erro ao verificar conexão');
        setTimeout(() => setUpdateMessage(null), 3000);
      }
      
      console.log('🔄 Verificação concluída!');
    } catch (error) {
      console.error('💥 Erro ao verificar conexão:', error);
      setUpdateMessage('❌ Erro inesperado ao verificar conexão');
      setTimeout(() => setUpdateMessage(null), 3000);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) return;
    
    // Verificar se o usuário já tem instâncias ativas
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setError('Usuário não autenticado');
      return;
    }

    const { data: existingInstances } = await supabase
      .from('whatsapp_instances')
      .select('id')
      .eq('user_id', user.user.id);
    
    // Se não tem instâncias, permitir criar uma nova (sem limite)
    if (!existingInstances || existingInstances.length === 0) {
      console.log('Usuário não tem instâncias ativas, permitindo criar nova conexão');
    } else {
      // Verificar limites do plano apenas se já tem instâncias
      if (!(await canPerformAction('criar_conexao', 1))) {
        setUpgradeReason('Limite de conexões atingido. Entre em contato via WhatsApp para adquirir um plano Premium.');
        setShowUpgradeModal(true);
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Usar o email do usuário para criar a instância única e passar o nome personalizado
      const result = await whatsappService.createInstance(user.user.email || '', newInstanceName.trim());
      
      if (result.success && result.data) {
        const createdInstance: WhatsAppInstance = {
          id: result.data.instanceId,
          name: newInstanceName.trim(), // Usar o nome digitado pelo usuário para exibição
          status: 'disconnected',
          createdAt: new Date().toISOString(),
          qrCode: result.data.qrCode,
          instanceId: result.data.instanceId,
          hash: result.data.hash
        };
        
        setInstances(prev => [...prev, createdInstance]);
        setNewInstanceName('');
        setShowCreateModal(false);
        
        // Mostrar QR code automaticamente
        setSelectedInstance(createdInstance);
        setShowQrModal(true);
        
        setUpdateMessage('WhatsApp criado com sucesso!');
        setTimeout(() => setUpdateMessage(null), 3000);
        
        // Atualizar limites
        await refreshLimits();
      } else {
        setError(result.error || 'Erro ao criar WhatsApp');
      }
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      setError('Erro inesperado ao criar WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  // Função removida - não utilizada

  // Função para configurar webhook automaticamente quando conexão for estabelecida
  const configurarWebhookAutomatico = async (instanceName: string) => {
    try {
      console.log('🔧 Configurando webhook automaticamente para:', instanceName);
      
      const { error } = await supabase.functions.invoke('evolution', {
        body: {
          instanceName: instanceName,
          action: 'setWebhook',
          webhookUrl: `${window.location.origin}/api/webhook/${instanceName}`
        }
      });

      if (error) {
        console.error('❌ Erro ao configurar webhook:', error);
      } else {
        console.log('✅ Webhook configurado automaticamente!');
      }
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error);
    }
  };

  // Função para gerar QR Code para uma instância específica
  const handleGenerateQrCodeForInstance = async (instance: WhatsAppInstance) => {
    if (!instance) return;
    
    console.log('🔄 Gerando QR code para instância:', instance.name);
    setIsGeneratingInitialQr(true);
    setError(null);
    
    try {
      const result = await whatsappService.generateNewQrCode(instance.instanceId || '');
      
      if (result.success && result.qrCode) {
        // Atualizar a instância selecionada com o novo QR code
        setSelectedInstance({
          ...instance,
          qrCode: result.qrCode
        });
        
        // Atualizar também na lista de instâncias
        setInstances(prev => prev.map(inst => 
          inst.id === instance.id 
            ? { ...inst, qrCode: result.qrCode }
            : inst
        ));
        
        console.log('✅ QR Code gerado com sucesso para:', instance.name);
      } else {
        console.error('❌ Erro ao gerar QR Code:', result.error);
        setError(result.error || 'Erro ao gerar QR Code');
      }
    } catch (error) {
      console.error('💥 Erro ao gerar QR Code:', error);
      setError('Erro inesperado ao gerar QR Code');
    } finally {
      setIsGeneratingInitialQr(false);
    }
  };

  // Função para gerar novo QR Code
  const handleGenerateNewQrCode = async () => {
    if (!selectedInstance) return;
    
    setIsGeneratingNewQr(true);
    setQrCodeExpired(false);
    
    try {
      const result = await whatsappService.generateNewQrCode(selectedInstance.instanceId || '');
      
      if (result.success && result.qrCode) {
        // Atualizar a instância selecionada com o novo QR code
        setSelectedInstance({
          ...selectedInstance,
          qrCode: result.qrCode
        });
        
        // Atualizar também na lista de instâncias
        setInstances(prev => prev.map(inst => 
          inst.id === selectedInstance.id 
            ? { ...inst, qrCode: result.qrCode }
            : inst
        ));
        
        console.log('✅ Novo QR Code gerado com sucesso!');
      } else {
        setError(result.error || 'Erro ao gerar novo QR Code');
      }
    } catch (error) {
      console.error('Erro ao gerar novo QR Code:', error);
      setError('Erro inesperado ao gerar novo QR Code');
      setQrCodeExpired(true);
    } finally {
      setIsGeneratingNewQr(false);
    }
  };

  const connectedInstances = instances.filter(inst => inst.status === 'connected');
  const disconnectedInstances = instances.filter(inst => inst.status !== 'connected');

  // Componente de Card de Conexão melhorado
  const ConnectionCard: React.FC<{ instance: WhatsAppInstance }> = ({ instance }) => {
    const isConnected = instance.status === 'connected';

    const handleMenuAction = (action: string, event: React.MouseEvent) => {
      event.stopPropagation();
      
      if (action === 'qrcode') {
        setSelectedInstance(instance);
        setShowQrModal(true);
        // Gerar QR code automaticamente quando abrir o modal
        handleGenerateQrCodeForInstance(instance);
      } else if (action === 'delete') {
        if (confirm(`Tem certeza que deseja excluir o WhatsApp "${instance.name}"? Esta ação não pode ser desfeita.`)) {
          handleDeleteInstance(instance.id);
        }
      }
      
      // Removido - não é mais necessário sem dropdown
    };

    // Função para deletar instância
    const handleDeleteInstance = async (instanceId: string) => {
      try {
        setIsLoading(true);
        
        const result = await whatsappService.deleteInstance(instanceId);
        
        if (result.success) {
          // Remover da lista local
          setInstances(prev => prev.filter(inst => inst.id !== instanceId));
          
          // Se a instância deletada estava selecionada, limpar seleção
          if (selectedInstance && selectedInstance.id === instanceId) {
            setSelectedInstance(null);
            setShowQrModal(false);
          }
          
          setUpdateMessage('WhatsApp excluído com sucesso!');
          setTimeout(() => setUpdateMessage(null), 3000);
          
          // ATUALIZAR LIMITES APÓS EXCLUIR - IMPORTANTE!
          console.log('🔄 Atualizando limites após exclusão...');
          await refreshLimits();
          
        } else {
          setError(result.error || 'Erro ao excluir WhatsApp');
        }
      } catch (error) {
        console.error('Erro ao excluir instância:', error);
        setError('Erro inesperado ao excluir WhatsApp');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Gerar iniciais para o avatar
    const initials = instance.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    return (
      <div className="relative">
        {/* Desktop Card */}
        <div className={`hidden md:block relative border rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
          isConnected 
            ? 'bg-card border-green-500/40' 
            : 'bg-card border-border hover:border-green-500/30'
        }`}>
          
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${
                  isConnected ? 'bg-green-500' : 'bg-muted'
                }`}>
                  {instance.profilePicUrl ? (
                    <img 
                      src={instance.profilePicUrl} 
                      alt={`Foto de ${instance.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-white font-semibold text-sm ${instance.profilePicUrl ? 'hidden' : ''}`}>
                    {initials}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-foreground font-medium truncate">
                    {instance.name}
                  </h3>
                  {instance.profileName && (
                    <div className="text-accent text-xs truncate">
                      {instance.profileName}
                    </div>
                  )}
                  <div className={`text-xs flex items-center gap-1 mt-1 ${
                    isConnected ? 'text-green-500' : 'text-muted-foreground'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-green-500' : 'bg-muted-foreground'
                    }`} />
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                {!isConnected && (
                  <button
                    onClick={(e) => handleMenuAction('qrcode', e)}
                    className="p-2 bg-green-500/10 hover:bg-green-500/20 border border-green-200 dark:border-green-800/50 rounded-lg transition-all duration-200 text-green-600 dark:text-green-400 hover:scale-105"
                    title="Conectar WhatsApp"
                  >
                    <QrCode size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => handleMenuAction('delete', e)}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-200 dark:border-red-800/50 rounded-lg transition-all duration-200 text-red-600 dark:text-red-400 hover:scale-105"
                  title="Excluir conexão"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Connection Info */}
            {instance.instanceId && (
              <div className="text-xs text-muted-foreground">
                ID: {instance.instanceId.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>

        {/* Mobile Compact Card */}
        <div className={`md:hidden bg-card border border-border rounded-lg p-3 transition-all duration-200 ${
          isConnected 
            ? 'border-green-500/40 bg-green-500/5' 
            : 'border-border'
        }`}>
          
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${
              isConnected ? 'bg-green-500' : 'bg-muted'
            }`}>
              {instance.profilePicUrl ? (
                <img 
                  src={instance.profilePicUrl} 
                  alt={`Foto de ${instance.name}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <span className={`text-white font-semibold text-xs ${instance.profilePicUrl ? 'hidden' : ''}`}>
                {initials}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {instance.name}
                </h3>
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  isConnected ? 'bg-green-500' : 'bg-muted-foreground'
                }`} />
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                isConnected ? 'text-green-500 font-medium' : 'text-muted-foreground'
              }`}>
                {isConnected ? '✓ Conectado' : '● Desconectado'}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isConnected && (
                <button
                  onClick={(e) => handleMenuAction('qrcode', e)}
                  className="p-1.5 bg-green-500/10 hover:bg-green-500/20 rounded-lg transition-colors text-green-500 hover:scale-105"
                  title="Conectar"
                >
                  <QrCode size={14} />
                </button>
              )}
              <button
                onClick={(e) => handleMenuAction('delete', e)}
                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-500 hover:scale-105"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };



  return (
    <div className="min-h-full bg-background p-2 md:p-6">
      <div className="page-content-wrapper">
        {/* Header Mobile */}
        <div className="md:hidden mb-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/20 rounded-xl mb-3">
              <Phone size={20} className="text-accent" />
            </div>
            <h1 className="text-lg font-semibold text-foreground mb-1">
              Dispositivos Conectados
            </h1>
            <p className="text-muted-foreground text-xs max-w-md mx-auto">
              Gerencie suas contas WhatsApp para envio de mensagens
            </p>
          </div>
        </div>

        {/* Header Desktop */}
        <div className="hidden md:block">
          <PageHeader
            title="Conexões"
            subtitle="Gerencie suas contas do WhatsApp para envio de mensagens."
            icon={<Phone size={32} className="text-primary" />}
            actions={
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="bg-muted text-muted-foreground hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                  title="Atualizar status das conexões"
                >
                  <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Atualizando...' : 'Atualizar'}
                </button>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2"
                >
                  <Plus size={16} />
                  Nova Conexão
                </button>
              </div>
            }
          />
        </div>

        {/* KPIs Desktop - Minimalista */}
        <div className="hidden md:grid grid-cols-3 gap-4 mb-6">
          {/* Total de Conexões */}
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{instances.length}</span>
                <span className="text-xs text-gray-600 dark:text-muted-foreground ml-2">total</span>
              </div>
              <div className="w-10 h-10 bg-accent/15 dark:bg-accent/10 rounded-lg flex items-center justify-center">
                <Phone size={20} className="text-accent" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">Total de Conexões</h3>
            <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">Contas configuradas</p>
          </div>

          {/* Conectadas */}
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{connectedInstances.length}</span>
                <span className="text-xs text-gray-600 dark:text-muted-foreground ml-2">ativas</span>
              </div>
              <div className="w-10 h-10 bg-accent/15 dark:bg-accent/10 rounded-lg flex items-center justify-center">
                <CheckCircle size={20} className="text-accent" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">Conectadas</h3>
            <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">Contas ativas</p>
          </div>

          {/* Desconectadas */}
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-4 hover:border-accent/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-2xl font-semibold text-gray-900 dark:text-foreground">{disconnectedInstances.length}</span>
                <span className="text-xs text-gray-600 dark:text-muted-foreground ml-2">inativas</span>
              </div>
              <div className="w-10 h-10 bg-accent/15 dark:bg-accent/10 rounded-lg flex items-center justify-center">
                <XCircle size={20} className="text-accent" />
              </div>
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-foreground">Desconectadas</h3>
            <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">Contas inativas</p>
          </div>
        </div>



        {/* Mensagem de Atualização */}
        {updateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-accent/10 border border-accent/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                <CheckCircle size={16} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{updateMessage}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Conteúdo Principal */}
        <div className="space-y-6">
          {isLoadingInstances ? (
            <div className="flex items-center justify-center py-12">
              <LoadingScreen page="conexoes" />
            </div>
          ) : (
            <>
              {/* Desktop: Todas as Conexões */}
              {instances.length > 0 && (
                <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-border">
                    <h2 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Phone size={16} className="text-accent" />
                      Conexões WhatsApp ({instances.length})
                    </h2>
                  </div>
                  
                  <div 
                    className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    {instances
                      .sort((a, b) => {
                        if (a.status === 'connected' && b.status !== 'connected') return -1;
                        if (a.status !== 'connected' && b.status === 'connected') return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((instance) => (
                        <ConnectionCard key={instance.id} instance={instance} />
                      ))}
                  </div>
                </div>
              )}

              {/* Mobile: Lista de Dispositivos */}
              {instances.length > 0 && (
                <div className="md:hidden space-y-4">
                  {/* Separador */}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold text-foreground">
                        Dispositivos ({instances.length})
                      </h2>
                      <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="p-1.5 bg-muted/50 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                        title="Atualizar status"
                      >
                        <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Lista de conexões */}
                    <div className="space-y-2">
                      {instances
                        .sort((a, b) => {
                          if (a.status === 'connected' && b.status !== 'connected') return -1;
                          if (a.status !== 'connected' && b.status === 'connected') return 1;
                          return a.name.localeCompare(b.name);
                        })
                        .map((instance) => (
                          <ConnectionCard key={instance.id} instance={instance} />
                        ))}
                      
                      {/* Botão para adicionar novo */}
                      <div className="bg-card border border-border rounded-lg p-3">
                        <div className="flex items-center justify-center h-16">
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 rounded-lg transition-all duration-200 text-accent font-medium text-sm"
                          >
                            <Plus size={16} />
                            Conectar Novo WhatsApp
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Desktop: Estado Vazio */}
              {instances.length === 0 && (
                <div className="hidden md:block bg-card border border-border rounded-xl p-8">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <Phone size={24} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Nenhuma conexão encontrada</h3>
                    <p className="text-xs text-muted-foreground mb-4">Adicione uma nova conexão para começar</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-accent text-accent-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      + Nova Conexão
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile: Estado Vazio */}
              {instances.length === 0 && (
                <div className="md:hidden space-y-6">
                  {/* Separador */}
                  <div className="border-t border-border pt-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                      Dispositivos (0)
                    </h2>

                    {/* Card vazio intuitivo */}
                    <div className="bg-card border border-border rounded-xl p-4">
                      <div className="flex items-center justify-center h-20">
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="flex items-center gap-3 px-4 py-3 bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 rounded-lg transition-all duration-200 text-accent font-medium"
                        >
                          <Plus size={20} />
                          Conectar WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal de Criar Nova Conexão */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header com gradiente sutil */}
              <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 border-b border-border">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <MessageCircle size={24} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">Nova Conexão</h2>
                      <p className="text-sm text-muted-foreground">WhatsApp Business</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Nome editável para exibição */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Nome para Identificação
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                      placeholder="Ex: WhatsApp da Empresa"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-foreground placeholder:text-muted-foreground transition-all"
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Phone size={16} className="text-muted-foreground" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este nome é apenas para você se organizar. A instância será criada automaticamente.
                  </p>
                </div>

                {/* Info card redesenhado */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings size={16} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-foreground mb-2">Como funciona:</p>
                      <div className="space-y-1.5 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Instância criada automaticamente com email único</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>QR Code gerado instantaneamente</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>Escaneie para conectar seu WhatsApp</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer com botões melhorados */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-border">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateInstance}
                    disabled={!newInstanceName.trim() || isLoading}
                    className="flex-1 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Criando Conexão...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Criar Conexão
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de QR Code */}
      <AnimatePresence>
        {showQrModal && selectedInstance && (
          <>
            {/* Esconder menu mobile */}
            <style>{`
              nav.md\\:hidden {
                display: none !important;
              }
            `}</style>
            
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] overflow-hidden"
              >
                {/* Header elegante */}
                <div className="relative bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 sm:p-6 border-b border-border">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                        <QrCode size={20} className="text-green-600 dark:text-green-400 sm:w-6 sm:h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-foreground">Conectar WhatsApp</h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">{selectedInstance.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowQrModal(false)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-all"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Status da conexão */}
                  <div className="flex items-center justify-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      {qrCodeExpired ? 'QR Code expirado' : 'Aguardando conexão...'}
                    </p>
                  </div>

                  {/* QR Code com design melhorado */}
                  <div className="text-center">
                    {selectedInstance.qrCode && !qrCodeExpired ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                      >
                        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border-2 border-green-200 dark:border-green-800 mx-auto inline-block">
                          <img
                            src={selectedInstance.qrCode}
                            alt="QR Code WhatsApp"
                            className="w-40 h-40 sm:w-48 sm:h-48 mx-auto"
                          />
                        </div>
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle size={12} className="text-white" />
                        </div>
                      </motion.div>
                    ) : (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 sm:p-12">
                        <div className="space-y-4">
                          {isGeneratingInitialQr || isGeneratingNewQr ? (
                            // Animação de carregamento para QR code
                            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
                              <div className="absolute inset-0 border-4 border-green-200 dark:border-green-800 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
                              <div className="absolute inset-2 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <RefreshCw size={24} className="text-green-600 dark:text-green-400" />
                              </div>
                            </div>
                          ) : (
                            // Ícone padrão
                            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
                              <div className="absolute inset-0 border-4 border-green-200 dark:border-green-800 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
                              <div className="absolute inset-2 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <QrCode size={24} className="text-green-600 dark:text-green-400" />
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <p className="text-sm sm:text-base font-medium text-foreground">
                              {isGeneratingInitialQr ? 'Gerando QR Code...' :
                               isGeneratingNewQr ? 'Gerando novo QR Code...' : 
                               qrCodeExpired ? 'QR Code expirado' : 'Conectando WhatsApp...'}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {isGeneratingInitialQr ? 'Aguarde um momento' :
                               isGeneratingNewQr ? 'Aguarde um momento' : 
                               qrCodeExpired ? 'Clique em "Gerar Novo QR Code"' : 'Gerando QR Code seguro'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Indicador de auto-refresh */}
                  {selectedInstance.qrCode && !qrCodeExpired && !isGeneratingInitialQr && !isGeneratingNewQr && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                        <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
                          <RefreshCw size={14} className="animate-spin" />
                          <span className="text-sm font-medium">
                            Auto-refresh em {secondsUntilRefresh}s
                          </span>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          QR Code será atualizado automaticamente
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Botão para gerar novo QR Code quando expirar */}
                  {qrCodeExpired && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <button
                        onClick={handleGenerateNewQrCode}
                        disabled={isGeneratingNewQr}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                      >
                        {isGeneratingNewQr ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={18} />
                            Gerar Novo QR Code
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}

                  {/* Botão "Já Conectei" para verificar status */}
                  {selectedInstance.qrCode && !qrCodeExpired && !isGeneratingInitialQr && !isGeneratingNewQr && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center"
                    >
                      <button
                        onClick={handleCheckConnection}
                        disabled={isRefreshing}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                      >
                        {isRefreshing ? (
                          <>
                            <RefreshCw size={18} className="animate-spin" />
                            Verificando...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            Já Conectei
                          </>
                        )}
                      </button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Clique aqui após escanear o QR code no WhatsApp
                      </p>
                    </motion.div>
                  )}

                  {/* Mensagem de erro */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/10 border border-red-500/30 rounded-xl p-3"
                    >
                      <p className="text-red-400 text-sm flex items-center">
                        <XCircle size={16} className="mr-2" />
                        {error}
                      </p>
                    </motion.div>
                  )}

                  {/* Instruções elegantes */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MessageCircle size={16} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-foreground mb-2">Como conectar:</p>
                        <div className="space-y-1.5 text-muted-foreground">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">1</span>
                            <span>Abra o WhatsApp no seu celular</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">2</span>
                            <span>Vá em Configurações → Dispositivos conectados</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">3</span>
                            <span>Toque em "Conectar um dispositivo"</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5">4</span>
                            <span>Aponte a câmera para este QR code</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer com botões melhorados */}
                <div className="px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-border">
                  <div className="flex gap-3">
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={`${isRefreshing ? 'animate-spin' : ''}`} />
                      {isRefreshing ? 'Verificando...' : 'Verificar Status'}
                    </button>
                    <button
                      onClick={() => setShowQrModal(false)}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConexoesPage; 