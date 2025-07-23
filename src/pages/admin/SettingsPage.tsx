import React, { useState, useEffect } from 'react';
import {
  Settings,
  Bell,
  Lock,
  Mail,
  DollarSign,
  Users,
  Eye,
  EyeOff,
  Check,
  X,
  Plus,
  Trash2,
  Copy,
  RefreshCw,
  Upload,
  Image,
  Crown,
  CreditCard,
  Pencil,
  Zap,
  Gift,
  Shield,
  Save,
  PhoneCall,
  Clock,
  Star,
  Flame
} from '../../utils/icons';
import Button from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  duration_days: number;
  discount_percentage?: number;
  is_promotion: boolean;
  is_active: boolean;
  is_featured?: boolean;
  benefits: string[];
  highlighted_benefits?: string[];
}

interface CallPlan {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_vip: boolean;
  is_active: boolean;
  features: string[];
}

interface VipOffer {
  id: string;
  name: string;
  description: string;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  duration_days: number;
  is_active: boolean;
  is_limited_time: boolean;
  expires_at?: string;
  benefits: string[];
}

interface PaymentGateway {
  id: string;
  name: string;
  type: 'pix' | 'picpay';
  is_active: boolean;
  config: {
    api_key?: string;
    secret_key?: string;
    webhook_url?: string;
    pix_key?: string;
    sandbox?: boolean;
    [key: string]: any;
  };
}

const SettingsPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [callPlans, setCallPlans] = useState<CallPlan[]>([]);
  const [vipOffers, setVipOffers] = useState<VipOffer[]>([]);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'calls' | 'vip' | 'gateways' | 'tests'>('plans');
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editingCallPlan, setEditingCallPlan] = useState<string | null>(null);
  const [editingVipOffer, setEditingVipOffer] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState<{[key: string]: boolean}>({});
  
  // Form data para planos de assinatura
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    duration_days: '',
    discount_percentage: '',
    is_active: true,
    is_featured: false,
    benefits: [''],
    highlighted_benefits: ['']
  });

  // Form data para planos de chamada
  const [callFormData, setCallFormData] = useState({
    name: '',
    description: '',
    duration_minutes: '',
    price: '',
    is_vip: false,
    is_active: true,
    features: ['']
  });

  // Form data para ofertas VIP
  const [vipFormData, setVipFormData] = useState({
    name: '',
    description: '',
    original_price: '',
    discounted_price: '',
    duration_days: '',
    is_active: true,
    is_limited_time: false,
    expires_at: '',
    benefits: ['']
  });

  const [gatewayForm, setGatewayForm] = useState({
    name: '',
    type: 'pix' as const,
    is_active: true,
    api_key: '',
    secret_key: '',
    webhook_url: '',
    pix_key: ''
  });

  const [testUserEmail, setTestUserEmail] = useState('');
  const [testPlanId, setTestPlanId] = useState('');

  useEffect(() => {
    // Teste de conexão com Supabase
    const testSupabaseConnection = async () => {
      try {
        console.log('=== TESTE DE CONEXÃO SUPABASE ===');
        console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('ANON KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA');
        
        // Teste simples de consulta
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('count')
          .limit(1);
          
        if (error) {
          console.error('Erro na conexão:', error);
        } else {
          console.log('Conexão OK, dados:', data);
        }
      } catch (err) {
        console.error('Erro no teste de conexão:', err);
      }
    };
    
    testSupabaseConnection();
    loadPlans();
    loadCallPlans();
    loadVipOffers();
    loadGateways();
  }, []);

  // Carregar planos de assinatura
  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar planos de chamada
  const loadCallPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('call_plans')
        .select('*')
        .order('duration_minutes', { ascending: true });

      if (error) throw error;
      setCallPlans(data || []);
    } catch (err) {
      console.error('Error loading call plans:', err);
    }
  };

  // Carregar ofertas VIP
  const loadVipOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('vip_offers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVipOffers(data || []);
    } catch (err) {
      console.error('Error loading VIP offers:', err);
    }
  };

  const loadGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGateways(data || []);
    } catch (err) {
      console.error('Error loading gateways:', err);
      // Fallback para dados mock em caso de erro
      const mockGateways: PaymentGateway[] = [
        {
          id: '1',
          name: 'PIX',
          type: 'pix',
          is_active: false,
          config: {
            secret_key: '',
            webhook_url: '',
            sandbox: true
          }
        },

      ];
      setGateways(mockGateways);
    }
  };

  // Funções para benefícios em destaque
  const handleAddHighlightedBenefit = () => {
    setFormData(prev => ({
      ...prev,
      highlighted_benefits: [...prev.highlighted_benefits, '']
    }));
  };

  const handleRemoveHighlightedBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlighted_benefits: prev.highlighted_benefits.filter((_, i) => i !== index)
    }));
  };

  const handleHighlightedBenefitChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      highlighted_benefits: prev.highlighted_benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  // Funções para planos de assinatura
  const handleAddBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleBenefitChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const startEditing = (plan: Plan) => {
    setEditingPlan(plan.id);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price.toString(),
      original_price: plan.original_price?.toString() || '',
      duration_days: plan.duration_days.toString(),
      discount_percentage: plan.discount_percentage?.toString() || '',
      is_active: plan.is_active,
      is_featured: plan.is_featured || false,
      benefits: plan.benefits.length > 0 ? plan.benefits : [''],
      highlighted_benefits: (plan.highlighted_benefits && plan.highlighted_benefits.length > 0) ? plan.highlighted_benefits : ['']
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      duration_days: '',
      discount_percentage: '',
      is_active: true,
      is_featured: false,
      benefits: [''],
      highlighted_benefits: ['']
    });
  };

  // Funções para planos de chamada
  const handleAddFeature = () => {
    setCallFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setCallFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setCallFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature)
    }));
  };

  const startEditingCallPlan = (plan: CallPlan) => {
    setEditingCallPlan(plan.id);
    setCallFormData({
      name: plan.name,
      description: plan.description,
      duration_minutes: plan.duration_minutes.toString(),
      price: plan.price.toString(),
      is_vip: plan.is_vip,
      is_active: plan.is_active,
      features: plan.features.length > 0 ? plan.features : ['']
    });
  };

  const resetCallForm = () => {
    setCallFormData({
      name: '',
      description: '',
      duration_minutes: '',
      price: '',
      is_vip: false,
      is_active: true,
      features: ['']
    });
  };

  // Funções para ofertas VIP
  const handleAddVipBenefit = () => {
    setVipFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const handleRemoveVipBenefit = (index: number) => {
    setVipFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleVipBenefitChange = (index: number, value: string) => {
    setVipFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((benefit, i) => i === index ? value : benefit)
    }));
  };

  const startEditingVipOffer = (offer: VipOffer) => {
    setEditingVipOffer(offer.id);
    setVipFormData({
      name: offer.name,
      description: offer.description,
      original_price: offer.original_price.toString(),
      discounted_price: offer.discounted_price.toString(),
      duration_days: offer.duration_days.toString(),
      is_active: offer.is_active,
      is_limited_time: offer.is_limited_time,
      expires_at: offer.expires_at ? offer.expires_at.split('T')[0] : '',
      benefits: offer.benefits.length > 0 ? offer.benefits : ['']
    });
  };

  const resetVipForm = () => {
    setVipFormData({
      name: '',
      description: '',
      original_price: '',
      discounted_price: '',
      duration_days: '',
      is_active: true,
      is_limited_time: false,
      expires_at: '',
      benefits: ['']
    });
  };

  // Salvar plano de assinatura
  const handleSavePlan = async () => {
    try {
      setIsLoading(true);
      
      console.log('=== DEBUG: Iniciando salvamento do plano ===');
      console.log('editingPlan:', editingPlan);
      console.log('formData:', formData);
      
      // Validar campos obrigatórios
      if (!formData.name.trim()) {
        alert('Nome do plano é obrigatório');
        return;
      }
      
      if (!formData.price || parseFloat(formData.price) <= 0) {
        alert('Preço deve ser maior que zero');
        return;
      }
      
      if (!formData.duration_days || parseInt(formData.duration_days) <= 0) {
        alert('Duração deve ser maior que zero');
        return;
      }
      
      const planData = {
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
          duration_days: parseInt(formData.duration_days),
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        is_promotion: !!formData.original_price,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        highlighted_benefits: formData.highlighted_benefits.filter(b => b.trim() !== '')
      };

      console.log('planData preparado:', planData);

      // Teste específico: tentar primeiro um SELECT para verificar se a tabela existe
      console.log('Testando acesso à tabela...');
      const { data: testData, error: testError } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .limit(1);
      
      if (testError) {
        console.error('Erro no teste de acesso à tabela:', testError);
        alert(`Erro de acesso à tabela: ${testError.message}`);
        return;
      }
      
      console.log('Acesso à tabela OK, dados existentes:', testData);

      if (editingPlan === 'new') {
        console.log('Inserindo novo plano...');
        
        // Teste com dados mínimos primeiro
        const minimalData = {
          name: formData.name,
          price: parseFloat(formData.price),
          duration_days: parseInt(formData.duration_days)
        };
        
        console.log('Tentando inserir dados mínimos primeiro:', minimalData);
        
        const { data, error } = await supabase
          .from('subscription_plans')
          .insert([minimalData])
          .select();
        
        if (error) {
          console.error('Erro ao inserir plano (dados mínimos):', error);
          console.error('Detalhes do erro:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          alert(`Erro ao inserir plano: ${error.message}\nCódigo: ${error.code}\nDetalhes: ${error.details || 'N/A'}`);
          return;
        }
        
        console.log('Plano inserido com sucesso (dados mínimos):', data);
        
        // Se inserção mínima funcionou, tentar atualizar com dados completos
        if (data && data[0]) {
          const planId = data[0].id;
          console.log('Atualizando com dados completos para ID:', planId);
          
          const { data: updateData, error: updateError } = await supabase
            .from('subscription_plans')
            .update({
              description: formData.description,
              original_price: formData.original_price ? parseFloat(formData.original_price) : null,
              discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
              is_promotion: !!formData.original_price,
              is_active: formData.is_active,
              is_featured: formData.is_featured,
              benefits: formData.benefits.filter(b => b.trim() !== ''),
              highlighted_benefits: formData.highlighted_benefits.filter(b => b.trim() !== '')
            })
            .eq('id', planId)
            .select();
            
          if (updateError) {
            console.error('Erro ao atualizar com dados completos:', updateError);
            alert(`Erro ao atualizar plano: ${updateError.message}`);
            return;
          }
          
          console.log('Plano atualizado com dados completos:', updateData);
        }
        
        alert('Plano criado com sucesso!');
      } else {
        console.log('Atualizando plano existente...');
        const { data, error } = await supabase
          .from('subscription_plans')
          .update(planData)
          .eq('id', editingPlan)
          .select();
        
        if (error) {
          console.error('Erro ao atualizar plano:', error);
          console.error('Detalhes do erro:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          alert(`Erro ao atualizar plano: ${error.message}\nCódigo: ${error.code}`);
          return;
        }
        
        console.log('Plano atualizado com sucesso:', data);
        alert('Plano atualizado com sucesso!');
      }

      await loadPlans();
      setEditingPlan(null);
      resetForm();
      console.log('=== DEBUG: Salvamento concluído com sucesso ===');
    } catch (err) {
      console.error('=== DEBUG: Erro no salvamento ===');
      console.error('Error saving plan:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      alert(`Erro ao salvar plano: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar plano de chamada
  const handleSaveCallPlan = async () => {
    try {
      setIsLoading(true);
      
      const callPlanData = {
        name: callFormData.name,
        description: callFormData.description,
        duration_minutes: parseInt(callFormData.duration_minutes),
        price: parseFloat(callFormData.price),
        is_vip: callFormData.is_vip,
        is_active: callFormData.is_active,
        features: callFormData.features.filter(f => f.trim() !== '')
      };

      if (editingCallPlan === 'new') {
      const { error } = await supabase
          .from('call_plans')
          .insert([callPlanData]);
      if (error) throw error;
      } else {
        const { error } = await supabase
          .from('call_plans')
          .update(callPlanData)
          .eq('id', editingCallPlan);
        if (error) throw error;
      }

      await loadCallPlans();
      setEditingCallPlan(null);
      resetCallForm();
    } catch (err) {
      console.error('Error saving call plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Salvar oferta VIP
  const handleSaveVipOffer = async () => {
    try {
      setIsLoading(true);
      
      const vipOfferData = {
        name: vipFormData.name,
        description: vipFormData.description,
        original_price: parseFloat(vipFormData.original_price),
        discounted_price: parseFloat(vipFormData.discounted_price),
        duration_days: parseInt(vipFormData.duration_days),
        is_active: vipFormData.is_active,
        is_limited_time: vipFormData.is_limited_time,
        expires_at: vipFormData.is_limited_time && vipFormData.expires_at ? 
          new Date(vipFormData.expires_at).toISOString() : null,
        benefits: vipFormData.benefits.filter(b => b.trim() !== '')
      };

      if (editingVipOffer === 'new') {
        const { error } = await supabase
          .from('vip_offers')
          .insert([vipOfferData]);
      if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vip_offers')
          .update(vipOfferData)
          .eq('id', editingVipOffer);
        if (error) throw error;
      }

      await loadVipOffers();
      setEditingVipOffer(null);
      resetVipForm();
    } catch (err) {
      console.error('Error saving VIP offer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleApiKeyVisibility = (gatewayId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [gatewayId]: !prev[gatewayId]
    }));
  };

  // Funções para gerenciar gateways
  const handleSaveGateway = async (gatewayId: string, config: any) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('payment_gateways')
        .update({ 
          config: config,
          updated_at: new Date().toISOString()
        })
        .eq('id', gatewayId);

      if (error) throw error;
      
      await loadGateways();
      alert('Gateway atualizado com sucesso!');
    } catch (err) {
      console.error('Error saving gateway:', err);
      alert('Erro ao salvar gateway. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGateway = async (gatewayId: string, isActive: boolean) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('payment_gateways')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', gatewayId);

      if (error) throw error;
      
      await loadGateways();
    } catch (err) {
      console.error('Error toggling gateway:', err);
      alert('Erro ao alterar status do gateway. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGatewayConfig = (gatewayId: string, field: string, value: string) => {
    setGateways(prev => prev.map(gateway => 
      gateway.id === gatewayId 
        ? {
            ...gateway,
            config: {
              ...gateway.config,
              [field]: value
            }
          }
        : gateway
    ));
  };

  // Função para resetar cadastro de usuário (para testes)
  const handleResetUserData = () => {
    if (window.confirm('Tem certeza que deseja limpar todos os dados de usuário? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // Função para testar pagamento
  const handleTestPayment = async () => {
    if (!testUserEmail || !testPlanId) {
      alert('Preencha email e selecione um plano para testar');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('simulate_payment_approval', {
        user_email_param: testUserEmail,
        plan_id_param: testPlanId
      });

      if (error) throw error;

      if (data.success) {
        alert(`✅ ${data.message}\nPayment ID: ${data.payment_id}`);
        setTestUserEmail('');
        setTestPlanId('');
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao testar pagamento:', error);
      alert('Erro ao simular pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para verificar assinatura
  const handleCheckSubscription = async () => {
    if (!testUserEmail) {
      alert('Digite um email para verificar');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_subscription_status', {
        user_email_param: testUserEmail
      });

      if (error) throw error;

      const status = data.is_subscribed ? '✅ ATIVO' : '❌ INATIVO';
      const message = `
Status: ${status}
Email: ${data.user_email}
Plano: ${data.plan_name || 'Nenhum'}
Expira em: ${data.expires_at ? new Date(data.expires_at).toLocaleString('pt-BR') : 'N/A'}
Dias restantes: ${data.days_remaining}
      `.trim();

      alert(message);
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      alert('Erro ao verificar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accent rounded-xl">
              <Settings size={24} className="text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
              <p className="text-muted-foreground">Gerencie planos, pagamentos e configurações do sistema</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border rounded-xl p-1 mb-8">
          <div className="flex space-x-1">
            {[
              { id: 'plans', label: 'Planos', icon: Crown },
              { id: 'calls', label: 'Chamadas', icon: PhoneCall },
              { id: 'vip', label: 'Ofertas VIP', icon: Star },
              { id: 'gateways', label: 'Pagamentos', icon: CreditCard },
              { id: 'tests', label: 'Testes', icon: Zap }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/10'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-xl p-6">
          {/* ... existing content with updated theme classes ... */}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;