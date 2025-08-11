import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, QrCode, Trash2, Wifi } from 'lucide-react';
import { 
  Phone, 
  X,
  RefreshCw,
  Plus,
  Activity,
  XCircle,
  ChevronRight,
  Power,
  AlertCircle,
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
  const { canPerformAction, getRemainingLimit, setShowUpgradeModal, setUpgradeReason, refreshLimits } = usePlanLimits();
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState<WhatsAppInstance | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInstances, setIsLoadingInstances] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  // Carregar instâncias do banco de dados
  useEffect(() => {
    loadInstances();
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

  // Limpar estilo do menu mobile quando modal fechar
  useEffect(() => {
    if (!showQrModal) {
      const styleElement = document.querySelector('style');
      if (styleElement && styleElement.textContent?.includes('nav.md\\:hidden')) {
        styleElement.remove();
      }
    }
  }, [showQrModal]);

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
      
      // Fazer requisição para atualizar status das conexões
      const response = await fetch('https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const instances = await response.json();
        console.log('✅ Dados recebidos da API:', instances);
        
        // Processar cada instância retornada pela API
        if (Array.isArray(instances)) {
          console.log(`🔄 Processando ${instances.length} instâncias...`);
          
          let connectionsUpdated = 0;
          let connectionsConnected = 0;
          
          for (const instance of instances) {
            const { id, connectionStatus, ownerJid, profileName, profilePicUrl } = instance;
            
            // Mapear status da Evolution API
            const newStatus = connectionStatus === 'open' ? 'connected' : 'disconnected';
            
            console.log(`📱 Atualizando ${instance.name}: ${connectionStatus} → ${newStatus}`);
            
            // Atualizar no banco de dados apenas se a instância pertence ao usuário atual
            const { data: user } = await supabase.auth.getUser();
            if (user.user) {
              const { error } = await supabase
                .from('whatsapp_instances')
                .update({
                  status: newStatus,
                  owner_jid: ownerJid,
                  profile_name: profileName,
                  profile_pic_url: profilePicUrl,
                  last_sync: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                })
                .eq('instance_id', id)
                .eq('user_id', user.user.id); // Filtrar apenas instâncias do usuário atual

              if (error) {
                console.error(`❌ Erro ao atualizar ${instance.name}:`, error);
              } else {
                console.log(`✅ ${instance.name} atualizado com sucesso`);
                connectionsUpdated++;
                if (newStatus === 'connected') {
                  connectionsConnected++;
                  
                  // Configurar webhook automaticamente quando instância for conectada
                  await configurarWebhookAutomatico(instance.name);
                }
              }
            }
          }
          
          // Recarregar as instâncias do banco com os novos status
          await loadInstances();
          
          // Mostrar feedback visual baseado no estado atualizado das instâncias
          const currentConnectedInstances = instances.filter(inst => inst.status === 'connected').length;
          console.log('🔍 Debug - Instâncias conectadas:', currentConnectedInstances);
          console.log('🔍 Debug - Todas as instâncias:', instances.map(inst => ({ name: inst.name, status: inst.status })));
          
          if (currentConnectedInstances > 0) {
            setUpdateMessage(`🎉 ${currentConnectedInstances} conexão(ões) ativa(s)!`);
          } else {
            setUpdateMessage(`🔄 ${connectionsUpdated} conexão(ões) atualizada(s)`);
          }
          
          // Limpar mensagem após 3 segundos
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

  const createInstance = async () => {
    if (!newInstanceName.trim()) return;
    
    // Verificar limites do plano
    if (!(await canPerformAction('criar_conexao', 1))) {
              setUpgradeReason('Limite de conexões atingido (1 máximo). Fale no WhatsApp para fazer upgrade com desconto exclusivo!');
      setShowUpgradeModal(true);
      return;
    }
    
    setIsLoading(true);
    
    const result = await whatsappService.createInstance(newInstanceName);
    
    if (result.success && result.data) {
      await loadInstances();
      
      // Atualizar limites após criação bem-sucedida
      await refreshLimits();
      
      // Fechar modal de criação
      setShowCreateModal(false);
      setNewInstanceName('');
      
      // Buscar a instância criada e gerar QR Code automaticamente
      const createdInstance = {
        id: result.data.instanceId,
        name: result.data.name,
        status: 'disconnected' as const,
        createdAt: new Date().toISOString()
      };
      
      // Aguardar um pouco e então gerar QR code
      setTimeout(() => {
        generateQrCode(createdInstance);
      }, 500);
      
    } else {
      console.error('Erro ao criar conexão:', result.error);
      alert('Erro ao criar conexão: ' + result.error);
    }
    
    setIsLoading(false);
  };

  const generateQrCode = async (instance: WhatsAppInstance) => {
    try {
      console.log('🔄 Gerando QR Code para conexão:', instance.name);
      
      const result = await whatsappService.connectInstance(instance.name);
      
      if (result.success && result.data) {
        console.log('📱 Dados do QR Code recebidos:', result.data);
        
        // Verificar se o base64 já contém o prefixo data:image/png;base64,
        let qrCodeData = result.data.base64;
        if (qrCodeData && !qrCodeData.startsWith('data:image/png;base64,')) {
          qrCodeData = `data:image/png;base64,${qrCodeData}`;
        }
        
        console.log('🔍 QR Code processado:', qrCodeData.substring(0, 50) + '...');
        
        setSelectedInstance({
          ...instance,
          qrCode: qrCodeData
        });
        setShowQrModal(true);
      } else {
        console.error('Erro ao gerar QR Code:', result.error);
        alert('Erro ao gerar QR Code. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      alert('Erro ao gerar QR Code. Tente novamente.');
    }
  };

  const disconnectInstance = async (instanceId: string) => {
    const updateResult = await whatsappService.updateInstanceStatus(instanceId, 'disconnected');
    
    if (updateResult.success) {
      await loadInstances();
    } else {
      console.error('Erro ao desconectar:', updateResult.error);
    }
  };

  const deleteInstance = async (instanceId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta conexão?')) return;
    
    const deleteResult = await whatsappService.deleteInstance(instanceId);
    
    if (deleteResult.success) {
      await loadInstances();
    } else {
      console.error('Erro ao deletar:', deleteResult.error);
      alert('Erro ao deletar conexão: ' + deleteResult.error);
    }
  };

  // Função para configurar webhook automaticamente quando conexão for estabelecida
  const configurarWebhookAutomatico = async (instanceName: string) => {
    try {
      console.log('🔧 Configurando webhook automaticamente para:', instanceName);
      
      // Fazer requisição para configurar webhook
      const response = await fetch(`https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/atualizar-webhook/${encodeURIComponent(instanceName)}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: "https://goqhudvrndtmxhbblrqa.supabase.co/functions/v1/webhook-mensagens",
            headers: {
              "autorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvcWh1ZHZybmR0bXhoYmJscnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTMwOTcsImV4cCI6MjA2ODI2OTA5N30.w3-CFhPBpSSSNCoLAWGzFlf_vtEBjPRRoytUzuP5SQM",
              "Content-Type": "application/json"
            },
            byEvents: false,
            base64: false,
            events: [
              "MESSAGES_UPSERT"
            ]
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Webhook configurado com sucesso:', result);
      } else {
        console.error('❌ Erro ao configurar webhook:', response.status);
        const errorText = await response.text();
        console.error('Detalhes do erro:', errorText);
      }
    } catch (error) {
      console.error('💥 Erro ao configurar webhook automaticamente:', error);
    }
  };

  const connectedInstances = instances.filter(inst => inst.status === 'connected');
  const disconnectedInstances = instances.filter(inst => inst.status !== 'connected');

  // Componente de Card de Conexão melhorado
  const ConnectionCard: React.FC<{ instance: WhatsAppInstance }> = ({ instance }) => {
    const isConnected = instance.status === 'connected';
    const menuId = `menu-${instance.id}`;
    const isMenuOpen = openMenuId === menuId;
    
    // Gerar iniciais para o avatar
    const initials = instance.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const handleMenuToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuId(isMenuOpen ? null : menuId);
    };

    const handleMenuAction = (action: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenMenuId(null);
      
      switch (action) {
        case 'qrcode':
          generateQrCode(instance);
          break;
        case 'delete':
          deleteInstance(instance.id);
          break;
        default:
          break;
      }
    };
    
    return (
      <div className="relative">
        {/* Desktop Card */}
        <div className={`hidden md:block relative border rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
          isConnected 
            ? 'bg-card border-accent/40' 
            : 'bg-card border-border hover:border-accent/30'
        }`}>
          
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${
                  isConnected ? 'bg-accent' : 'bg-muted'
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
                    isConnected ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-accent' : 'bg-muted-foreground'
                    }`} />
                    {isConnected ? 'Conectado' : 'Desconectado'}
                  </div>
                </div>
              </div>

              {/* Menu Actions */}
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                    {!isConnected && (
                      <button
                        onClick={(e) => handleMenuAction('qrcode', e)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent/5 transition-colors flex items-center gap-2 text-foreground"
                      >
                        <QrCode size={14} />
                        Conectar
                      </button>
                    )}
                    <button
                      onClick={(e) => handleMenuAction('delete', e)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-500"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                )}
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
            ? 'border-accent/40 bg-accent/5' 
            : 'border-border'
        }`}>
          
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 ${
              isConnected ? 'bg-accent' : 'bg-muted'
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
                  isConnected ? 'bg-accent' : 'bg-muted-foreground'
                }`} />
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                isConnected ? 'text-accent font-medium' : 'text-muted-foreground'
              }`}>
                {isConnected ? '✓ Conectado' : '● Desconectado'}
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!isConnected && (
                <button
                  onClick={(e) => handleMenuAction('qrcode', e)}
                  className="p-1.5 bg-accent/10 hover:bg-accent/20 rounded-lg transition-colors text-accent"
                  title="Conectar"
                >
                  <QrCode size={14} />
                </button>
              )}
              <div className="relative">
                <button
                  onClick={handleMenuToggle}
                  className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground"
                >
                  <MoreVertical size={16} />
                </button>

                {/* Mobile Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg z-10 py-1 min-w-[120px]">
                    <button
                      onClick={(e) => handleMenuAction('delete', e)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2 text-red-500"
                    >
                      <Trash2 size={14} />
                      Excluir
                    </button>
                  </div>
                )}
              </div>
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
                    onClick={(e) => {
                      if (e.target === e.currentTarget) {
                        setOpenMenuId(null);
                      }
                    }}
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
                {/* Input com design mais elegante */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Nome do Dispositivo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newInstanceName}
                      onChange={(e) => setNewInstanceName(e.target.value)}
                      placeholder="Ex: WhatsApp Principal"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 text-foreground placeholder:text-muted-foreground transition-all"
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Phone size={16} className="text-muted-foreground" />
                    </div>
                  </div>
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
                          <span>Instância WhatsApp será criada</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>QR Code gerado automaticamente</span>
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
                    onClick={createInstance}
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
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Aguardando conexão...</p>
                  </div>

                  {/* QR Code com design melhorado */}
                  <div className="text-center">
                    {selectedInstance.qrCode ? (
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
                          {/* Animação de carregamento mais elaborada */}
                          <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
                            <div className="absolute inset-0 border-4 border-green-200 dark:border-green-800 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-2 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <QrCode size={24} className="text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm sm:text-base font-medium text-foreground">Conectando WhatsApp...</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">Gerando QR Code seguro</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

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