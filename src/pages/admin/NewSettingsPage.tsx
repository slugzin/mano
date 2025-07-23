import React, { useState, useEffect } from 'react';
import {
  Crown,
  PhoneCall,
  Star,
  CreditCard,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Clock,
  DollarSign
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
  benefits: string[];
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

const NewSettingsPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [callPlans, setCallPlans] = useState<CallPlan[]>([]);
  const [vipOffers, setVipOffers] = useState<VipOffer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'plans' | 'calls' | 'vip'>('plans');
  
  // Estados de edição
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [editingCallPlan, setEditingCallPlan] = useState<string | null>(null);
  const [editingVipOffer, setEditingVipOffer] = useState<string | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', original_price: '', 
    duration_days: '', discount_percentage: '', is_active: true, benefits: ['']
  });

  const [callFormData, setCallFormData] = useState({
    name: '', description: '', duration_minutes: '', price: '', 
    is_vip: false, is_active: true, features: ['']
  });

  const [vipFormData, setVipFormData] = useState({
    name: '', description: '', original_price: '', discounted_price: '', 
    duration_days: '', is_active: true, is_limited_time: false, expires_at: '', benefits: ['']
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadPlans(), loadCallPlans(), loadVipOffers()]);
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('duration_days');
      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
    }
  };

  const loadCallPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('call_plans')
        .select('*')
        .order('duration_minutes');
      if (error) throw error;
      setCallPlans(data || []);
    } catch (err) {
      console.error('Error loading call plans:', err);
    }
  };

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

  // Planos de Assinatura
  const handleSavePlan = async () => {
    try {
      setIsLoading(true);
      const planData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        duration_days: parseInt(formData.duration_days),
        discount_percentage: formData.discount_percentage ? parseFloat(formData.discount_percentage) : null,
        is_promotion: !!formData.original_price,
        is_active: formData.is_active,
        benefits: formData.benefits.filter(b => b.trim())
      };

      if (editingPlan === 'new') {
        await supabase.from('subscription_plans').insert([planData]);
      } else {
        await supabase.from('subscription_plans').update(planData).eq('id', editingPlan);
      }

      await loadPlans();
      setEditingPlan(null);
      setFormData({ name: '', description: '', price: '', original_price: '', 
        duration_days: '', discount_percentage: '', is_active: true, benefits: [''] });
    } catch (err) {
      console.error('Error saving plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      await supabase.from('subscription_plans').delete().eq('id', id);
      await loadPlans();
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  // Planos de Chamada
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
        features: callFormData.features.filter(f => f.trim())
      };

      if (editingCallPlan === 'new') {
        await supabase.from('call_plans').insert([callPlanData]);
      } else {
        await supabase.from('call_plans').update(callPlanData).eq('id', editingCallPlan);
      }

      await loadCallPlans();
      setEditingCallPlan(null);
      setCallFormData({ name: '', description: '', duration_minutes: '', price: '', 
        is_vip: false, is_active: true, features: [''] });
    } catch (err) {
      console.error('Error saving call plan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCallPlan = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano de chamada?')) return;
    try {
      await supabase.from('call_plans').delete().eq('id', id);
      await loadCallPlans();
    } catch (err) {
      console.error('Error deleting call plan:', err);
    }
  };

  // Ofertas VIP
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
        benefits: vipFormData.benefits.filter(b => b.trim())
      };

      if (editingVipOffer === 'new') {
        await supabase.from('vip_offers').insert([vipOfferData]);
      } else {
        await supabase.from('vip_offers').update(vipOfferData).eq('id', editingVipOffer);
      }

      await loadVipOffers();
      setEditingVipOffer(null);
      setVipFormData({ name: '', description: '', original_price: '', discounted_price: '', 
        duration_days: '', is_active: true, is_limited_time: false, expires_at: '', benefits: [''] });
    } catch (err) {
      console.error('Error saving VIP offer:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVipOffer = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta oferta VIP?')) return;
    try {
      await supabase.from('vip_offers').delete().eq('id', id);
      await loadVipOffers();
    } catch (err) {
      console.error('Error deleting VIP offer:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-400 via-pink-500 to-rose-500 bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-gray-400 mt-2">Gerencie planos, chamadas e ofertas VIP</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === 'plans'
                ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Crown size={18} />
              Planos de Assinatura
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('calls')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === 'calls'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <PhoneCall size={18} />
              Planos de Chamadas
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('vip')}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
              activeTab === 'vip'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Star size={18} />
              Ofertas VIP
            </div>
          </button>
        </div>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="bg-black/80 backdrop-blur-sm border border-pink-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-pink-400">Planos de Assinatura</h3>
            <Button
              onClick={() => setEditingPlan('new')}
              leftIcon={<Plus size={18} />}
              className="bg-gradient-to-r from-pink-500 to-rose-500"
            >
              Novo Plano
            </Button>
          </div>

          {/* Form */}
          {editingPlan && (
            <div className="mb-6 bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
              <h4 className="text-lg font-medium text-white mb-4">
                {editingPlan === 'new' ? 'Adicionar Novo Plano' : 'Editar Plano'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nome do plano"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Duração (dias)"
                  value={formData.duration_days}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_days: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Preço (R$)"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Preço original (opcional)"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
              </div>

              <textarea
                placeholder="Descrição"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4"
                rows={3}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Benefícios</label>
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Benefício"
                      value={benefit}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        benefits: prev.benefits.map((b, i) => i === index ? e.target.value : b)
                      }))}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                    {formData.benefits.length > 1 && (
                      <Button
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          benefits: prev.benefits.filter((_, i) => i !== index)
                        }))}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20 px-3"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }))}
                  leftIcon={<Plus size={16} />}
                  className="border-pink-500/30 text-pink-400 hover:bg-pink-500/20"
                >
                  Adicionar Benefício
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEditingPlan(null);
                    setFormData({ name: '', description: '', price: '', original_price: '', 
                      duration_days: '', discount_percentage: '', is_active: true, benefits: [''] });
                  }}
                  className="border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSavePlan}
                  isLoading={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-rose-500"
                >
                  {editingPlan === 'new' ? 'Adicionar' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {/* Plans List */}
          <div className="grid gap-3">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                      {plan.discount_percentage && (
                        <span className="bg-pink-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {plan.discount_percentage}% OFF
                        </span>
                      )}
                      {!plan.is_active && (
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-pink-400">
                        R$ {plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      {plan.original_price && (
                        <span className="text-sm text-gray-500 line-through">
                          R$ {plan.original_price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                      <span className="text-gray-400 text-sm">/ {plan.duration_days} dias</span>
                    </div>

                    <div className="space-y-1">
                      {plan.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                          <Check size={12} className="text-pink-400" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => {
                        setEditingPlan(plan.id);
                        setFormData({
                          name: plan.name,
                          description: plan.description,
                          price: plan.price.toString(),
                          original_price: plan.original_price?.toString() || '',
                          duration_days: plan.duration_days.toString(),
                          discount_percentage: plan.discount_percentage?.toString() || '',
                          is_active: plan.is_active,
                          benefits: plan.benefits.length > 0 ? plan.benefits : ['']
                        });
                      }}
                      leftIcon={<Pencil size={14} />}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs px-2"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeletePlan(plan.id)}
                      leftIcon={<Trash2 size={14} />}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs px-2"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calls Tab */}
      {activeTab === 'calls' && (
        <div className="bg-black/80 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-purple-400">Planos de Chamadas</h3>
            <Button
              onClick={() => setEditingCallPlan('new')}
              leftIcon={<Plus size={18} />}
              className="bg-gradient-to-r from-purple-500 to-indigo-500"
            >
              Nova Chamada
            </Button>
          </div>

          {/* Call Form */}
          {editingCallPlan && (
            <div className="mb-6 bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
              <h4 className="text-lg font-medium text-white mb-4">
                {editingCallPlan === 'new' ? 'Adicionar Plano de Chamada' : 'Editar Plano de Chamada'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nome do plano"
                  value={callFormData.name}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Duração (minutos)"
                  value={callFormData.duration_minutes}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Preço (R$)"
                  step="0.01"
                  value={callFormData.price}
                  onChange={(e) => setCallFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={callFormData.is_vip}
                      onChange={(e) => setCallFormData(prev => ({ ...prev, is_vip: e.target.checked }))}
                      className="w-5 h-5 text-purple-500 bg-gray-800 border-gray-600 rounded"
                    />
                    <span className="text-gray-300">Plano VIP</span>
                  </label>
                </div>
              </div>

              <textarea
                placeholder="Descrição"
                value={callFormData.description}
                onChange={(e) => setCallFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4"
                rows={3}
              />

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Recursos</label>
                {callFormData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Recurso"
                      value={feature}
                      onChange={(e) => setCallFormData(prev => ({
                        ...prev,
                        features: prev.features.map((f, i) => i === index ? e.target.value : f)
                      }))}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                    {callFormData.features.length > 1 && (
                      <Button
                        onClick={() => setCallFormData(prev => ({
                          ...prev,
                          features: prev.features.filter((_, i) => i !== index)
                        }))}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20 px-3"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => setCallFormData(prev => ({ ...prev, features: [...prev.features, ''] }))}
                  leftIcon={<Plus size={16} />}
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                >
                  Adicionar Recurso
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEditingCallPlan(null);
                    setCallFormData({ name: '', description: '', duration_minutes: '', price: '', 
                      is_vip: false, is_active: true, features: [''] });
                  }}
                  className="border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveCallPlan}
                  isLoading={isLoading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500"
                >
                  {editingCallPlan === 'new' ? 'Adicionar' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {/* Call Plans List */}
          <div className="grid gap-3">
            {callPlans.map((plan) => (
              <div key={plan.id} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <PhoneCall size={16} className="text-purple-400" />
                      <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                      {plan.is_vip && (
                        <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                          VIP
                        </span>
                      )}
                      {!plan.is_active && (
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">{plan.description}</p>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-purple-400" />
                        <span className="text-white font-medium">{plan.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-green-400" />
                        <span className="text-2xl font-bold text-green-400">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                          <Check size={12} className="text-purple-400" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => {
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
                      }}
                      leftIcon={<Pencil size={14} />}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs px-2"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteCallPlan(plan.id)}
                      leftIcon={<Trash2 size={14} />}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs px-2"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIP Tab */}
      {activeTab === 'vip' && (
        <div className="bg-black/80 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-yellow-400">Ofertas VIP</h3>
            <Button
              onClick={() => setEditingVipOffer('new')}
              leftIcon={<Plus size={18} />}
              className="bg-gradient-to-r from-yellow-500 to-orange-500"
            >
              Nova Oferta VIP
            </Button>
          </div>

          {/* VIP Form */}
          {editingVipOffer && (
            <div className="mb-6 bg-gray-900/50 border border-gray-700/50 rounded-xl p-6">
              <h4 className="text-lg font-medium text-white mb-4">
                {editingVipOffer === 'new' ? 'Adicionar Oferta VIP' : 'Editar Oferta VIP'}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Nome da oferta"
                  value={vipFormData.name}
                  onChange={(e) => setVipFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Duração (dias)"
                  value={vipFormData.duration_days}
                  onChange={(e) => setVipFormData(prev => ({ ...prev, duration_days: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Preço original (R$)"
                  step="0.01"
                  value={vipFormData.original_price}
                  onChange={(e) => setVipFormData(prev => ({ ...prev, original_price: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
                <input
                  type="number"
                  placeholder="Preço com desconto (R$)"
                  step="0.01"
                  value={vipFormData.discounted_price}
                  onChange={(e) => setVipFormData(prev => ({ ...prev, discounted_price: e.target.value }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white"
                />
              </div>

              <textarea
                placeholder="Descrição da oferta"
                value={vipFormData.description}
                onChange={(e) => setVipFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white mb-4"
                rows={3}
              />

              <div className="flex items-center gap-6 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={vipFormData.is_limited_time}
                    onChange={(e) => setVipFormData(prev => ({ ...prev, is_limited_time: e.target.checked }))}
                    className="w-5 h-5 text-yellow-500 bg-gray-800 border-gray-600 rounded"
                  />
                  <span className="text-gray-300">Oferta por tempo limitado</span>
                </label>
                
                {vipFormData.is_limited_time && (
                  <input
                    type="date"
                    value={vipFormData.expires_at}
                    onChange={(e) => setVipFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  />
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">Benefícios VIP</label>
                {vipFormData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Benefício VIP"
                      value={benefit}
                      onChange={(e) => setVipFormData(prev => ({
                        ...prev,
                        benefits: prev.benefits.map((b, i) => i === index ? e.target.value : b)
                      }))}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    />
                    {vipFormData.benefits.length > 1 && (
                      <Button
                        onClick={() => setVipFormData(prev => ({
                          ...prev,
                          benefits: prev.benefits.filter((_, i) => i !== index)
                        }))}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20 px-3"
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  onClick={() => setVipFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }))}
                  leftIcon={<Plus size={16} />}
                  className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                >
                  Adicionar Benefício
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setEditingVipOffer(null);
                    setVipFormData({ name: '', description: '', original_price: '', discounted_price: '', 
                      duration_days: '', is_active: true, is_limited_time: false, expires_at: '', benefits: [''] });
                  }}
                  className="border-gray-600 text-gray-400"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveVipOffer}
                  isLoading={isLoading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500"
                >
                  {editingVipOffer === 'new' ? 'Adicionar' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {/* VIP Offers List */}
          <div className="grid gap-3">
            {vipOffers.map((offer) => (
              <div key={offer.id} className="bg-gray-900/50 border border-gray-700/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={16} className="text-yellow-400" />
                      <h4 className="text-lg font-bold text-white">{offer.name}</h4>
                      <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                        {offer.discount_percentage}% OFF
                      </span>
                      {offer.is_limited_time && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                          LIMITADA
                        </span>
                      )}
                      {!offer.is_active && (
                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                          Inativa
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-3">{offer.description}</p>
                    
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-yellow-400">
                        R$ {offer.discounted_price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        R$ {offer.original_price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-gray-400 text-sm">/ {offer.duration_days} dias</span>
                    </div>

                    {offer.expires_at && (
                      <p className="text-red-400 text-xs mb-2">
                        Expira em: {new Date(offer.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    )}

                    <div className="space-y-1">
                      {offer.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                          <Star size={12} className="text-yellow-400" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      onClick={() => {
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
                      }}
                      leftIcon={<Pencil size={14} />}
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20 text-xs px-2"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDeleteVipOffer(offer.id)}
                      leftIcon={<Trash2 size={14} />}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs px-2"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSettingsPage; 