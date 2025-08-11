import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  MessageCircle, 
  Clock, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  Play,
  Pause,
  Settings,
  Zap,
  Target,
  Building,
  Activity,
  Shield
} from '../../utils/icons';
import { FileText, Timer, MessageSquare, ArrowRight, ArrowUp, ArrowDown, Info } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import { supabase } from '../../lib/supabase';
import { usePlanLimits } from '../../contexts/PlanLimitsContext';
import { 
  VARIAVEIS_DISPONIVEIS, 
  detectarVariaveis, 
  criarPreview 
} from '../../utils/variables';


// Tipos
interface Fluxo {
  id: string;
  nome: string;
  descricao: string;
  criado_em: string;
  ativo: boolean;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  preview: string;
  created_at: string;
  updated_at: string;
}

interface FraseWhatsApp {
  id: string;
  fase: string;
  tipo: string;
  texto: string;
  criada_em: string;
  delay_seconds: number;
  delay_min_seconds: number;
  delay_max_seconds: number;
  formato: 'text' | 'image' | 'audio' | 'video';
  conteudo: string;
  ordem: number;
  ativo: boolean;
  fluxo_id: string;
}

interface Template {
  id: string;
  nome: string;
  descricao: string;
  frases: FraseWhatsApp[];
  criado_em: string;
}

const FluxosPage: React.FC = () => {
  const { canPerformAction, getRemainingLimit, setShowUpgradeModal, setUpgradeReason, refreshLimits } = usePlanLimits();
  const [activeTab, setActiveTab] = useState<'templates' | 'fluxos'>('fluxos');
  

  const [templates, setTemplates] = useState<Template[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<MessageTemplate[]>([]);
  const [fluxos, setFluxos] = useState<Fluxo[]>([]);
  const [frases, setFrases] = useState<FraseWhatsApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFluxo, setExpandedFluxo] = useState<string | null>(null);
  
  // Estados para modais
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showFluxoModal, setShowFluxoModal] = useState(false);
  const [showFraseModal, setShowFraseModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editingFluxo, setEditingFluxo] = useState<Fluxo | null>(null);
  const [editingFrase, setEditingFrase] = useState<FraseWhatsApp | null>(null);
  
  // Estados para formulários
  const [templateForm, setTemplateForm] = useState({
    name: '',
    content: '',
    preview: ''
  });
  
  const [fluxoForm, setFluxoForm] = useState({
    nome: '',
    descricao: ''
  });
  
  const [fraseForm, setFraseForm] = useState({
    fase: 'fase_1',
    tipo: 'frase1',
    texto: '',
    delay_seconds: 0,
    delay_min_seconds: 30,
    delay_max_seconds: 60,
    formato: 'text' as 'text' | 'image' | 'audio' | 'video',
    conteudo: '',
    ordem: 1,
    fluxo_id: ''
  });

  // Carregar dados
  useEffect(() => {
    loadData();

    // Timeout de segurança para evitar carregamento infinito
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Timeout na página de fluxos, forçando fim do loading');
        setLoading(false);
      }
    }, 10000); // 10 segundos

    return () => clearTimeout(timeoutId);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('Carregando dados de fluxos, frases e templates...');

      // Carregar fluxos
      const { data: fluxosData, error: fluxosError } = await supabase
        .from('fluxos')
        .select('*')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (fluxosError) {
        console.error('Erro na consulta fluxos:', fluxosError);
        if (fluxosError.code === 'PGRST116' || fluxosError.message.includes('does not exist')) {
          console.log('Tabela fluxos não existe ainda. Usando dados vazios.');
          setFluxos([]);
        }
      } else {
        setFluxos(fluxosData || []);
      }

      // Carregar message_templates
      const { data: messageTemplatesData, error: messageTemplatesError } = await supabase
        .from('message_templates')
        .select('*')
        .order('name', { ascending: true });

      if (messageTemplatesError) {
        console.error('Erro na consulta message_templates:', messageTemplatesError);
        if (messageTemplatesError.code === 'PGRST116' || messageTemplatesError.message.includes('does not exist')) {
          console.log('Tabela message_templates não existe ainda. Usando dados vazios.');
          setMessageTemplates([]);
        }
      } else {
        setMessageTemplates(messageTemplatesData || []);
      }

      // Carregar frases
      const { data: frasesData, error: frasesError } = await supabase
        .from('frases_whatsapp')
        .select('*')
        .eq('ativo', true)
        .order('fase', { ascending: true })
        .order('ordem', { ascending: true });

      if (frasesError) {
        console.error('Erro na consulta frases_whatsapp:', frasesError);
        if (frasesError.code === 'PGRST116' || frasesError.message.includes('does not exist')) {
          console.log('Tabela frases_whatsapp não existe ainda. Usando dados vazios.');
          setFrases([]);
        }
      } else {
        setFrases(frasesData || []);
      }

      // Agrupar frases em templates (por fase) - apenas para compatibilidade
      const templatesMap = new Map<string, Template>();
      frasesData?.forEach(frase => {
        if (!templatesMap.has(frase.fase)) {
          templatesMap.set(frase.fase, {
            id: frase.fase,
            nome: frase.fase.replace('_', ' ').toUpperCase(),
            descricao: `Template com ${frasesData.filter(f => f.fase === frase.fase).length} mensagens`,
            frases: [],
            criado_em: frase.criada_em
          });
        }
        templatesMap.get(frase.fase)!.frases.push(frase);
      });

      setTemplates(Array.from(templatesMap.values()));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setFluxos([]);
      setMessageTemplates([]);
      setFrases([]);
      setTemplates([]);
    }
    setLoading(false);
  };

  const handleSaveTemplate = async () => {
    try {
      // Verificar limites do plano (apenas para novos templates)
      if (!editingTemplate && !(await canPerformAction('criar_template', 1))) {
        setUpgradeReason('Limite de templates atingido (1 máximo). Fale no WhatsApp para fazer upgrade com desconto exclusivo!');
        setShowUpgradeModal(true);
        return;
      }

      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        alert('Usuário não autenticado');
        return;
      }

      const templateData = {
        name: templateForm.name,
        content: templateForm.content,
        preview: templateForm.preview,
        user_id: user.user.id // Adicionar user_id
      };

      console.log('Salvando template com dados:', templateData);

      if (editingTemplate) {
        const { error } = await supabase
          .from('message_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);
        
        if (error) {
          console.error('Erro ao atualizar template:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('message_templates')
          .insert([templateData]);
        
        if (error) {
          console.error('Erro ao inserir template:', error);
          throw error;
        }
      }

      setShowTemplateModal(false);
      resetTemplateForm();
      await loadData();
      
      // Atualizar limites após salvar template com sucesso
      await refreshLimits();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template. Verifique o console para mais detalhes.');
    }
  };

  const handleSaveFluxo = async () => {
    try {
      // Pegar o usuário atual
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        alert('Usuário não autenticado');
        return;
      }

      const fluxoData = {
        nome: fluxoForm.nome,
        descricao: fluxoForm.descricao,
        user_id: user.user.id // Adicionar user_id
      };

      console.log('Salvando fluxo com dados:', fluxoData);

      if (editingFluxo) {
        const { error } = await supabase
          .from('fluxos')
          .update(fluxoData)
          .eq('id', editingFluxo.id);
        
        if (error) {
          console.error('Erro ao atualizar fluxo:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('fluxos')
          .insert([fluxoData]);
        
        if (error) {
          console.error('Erro ao inserir fluxo:', error);
          throw error;
        }
      }

      setShowFluxoModal(false);
      resetFluxoForm();
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar fluxo:', error);
      alert('Erro ao salvar fluxo. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteFluxo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fluxos')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar fluxo:', error);
        throw error;
      }
      
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar fluxo:', error);
      alert('Erro ao deletar fluxo. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar template:', error);
        throw error;
      }
      
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      alert('Erro ao deletar template. Verifique o console para mais detalhes.');
    }
  };

  const handleSaveFrase = async () => {
    try {
      const fraseData = {
        ...fraseForm,
        conteudo: fraseForm.texto
      };

      console.log('Salvando frase com dados:', fraseData);

      if (editingFrase) {
        const { error } = await supabase
          .from('frases_whatsapp')
          .update(fraseData)
          .eq('id', editingFrase.id);
        
        if (error) {
          console.error('Erro ao atualizar frase:', error);
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('frases_whatsapp')
          .insert([fraseData]);
        
        if (error) {
          console.error('Erro ao inserir frase:', error);
          throw error;
        }
      }

      setShowFraseModal(false);
      resetFraseForm();
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar frase:', error);
      alert('Erro ao salvar mensagem. Verifique o console para mais detalhes.');
    }
  };

  const handleDeleteFrase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('frases_whatsapp')
        .update({ ativo: false })
        .eq('id', id);
      
      if (error) {
        console.error('Erro ao deletar frase:', error);
        throw error;
      }
      
      await loadData();
    } catch (error) {
      console.error('Erro ao deletar frase:', error);
      alert('Erro ao deletar mensagem. Verifique o console para mais detalhes.');
    }
  };

  const resetTemplateForm = () => {
    setTemplateForm({ name: '', content: '', preview: '' });
    setEditingTemplate(null);
  };

  const resetFluxoForm = () => {
    setFluxoForm({ nome: '', descricao: '' });
    setEditingFluxo(null);
  };

  const resetFraseForm = () => {
    setFraseForm({
      fase: 'fase_1',
      tipo: 'frase1',
      texto: '',
      delay_seconds: 0,
      delay_min_seconds: 30,
      delay_max_seconds: 60,
      formato: 'text' as 'text' | 'image' | 'audio' | 'video',
      conteudo: '',
      ordem: 1,
      fluxo_id: ''
    });
    setEditingFrase(null);
  };

  const openEditFrase = (frase: FraseWhatsApp) => {
    setFraseForm({
      fase: frase.fase,
      tipo: frase.tipo,
      texto: frase.texto,
      delay_seconds: frase.delay_seconds,
      delay_min_seconds: frase.delay_min_seconds,
      delay_max_seconds: frase.delay_max_seconds,
      formato: frase.formato,
      conteudo: frase.conteudo,
      ordem: frase.ordem,
      fluxo_id: frase.fluxo_id
    });
    setEditingFrase(frase);
    setShowFraseModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground text-sm">Carregando fluxos...</p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Se demorar muito, verifique o console para detalhes
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header Mobile */}
      <div className="md:hidden border-b border-border bg-background p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <BarChart3 size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-foreground">Fluxos CaptaZap</h1>
            <p className="text-xs text-muted-foreground">Gerencie templates e fluxos</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header Desktop */}
        <div className="hidden md:block">
          <PageHeader
            title="Fluxos CaptaZap"
            subtitle="Crie e gerencie templates e fluxos automáticos"
            icon={<BarChart3 size={24} className="text-accent" />}
          />
        </div>

        <div className="p-4 md:p-6">
        {/* Tabs */}
        <div className="flex mb-6 bg-muted/20 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText size={16} />
              Templates
            </div>
          </button>
          <button
            onClick={() => setActiveTab('fluxos')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'fluxos'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Zap size={16} />
              Configurar Fluxos
            </div>
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'templates' ? (
          <div>
            {/* Header Templates */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">Templates</h2>
                <p className="text-sm text-muted-foreground">
                  Gerencie seus templates de mensagens
                </p>
              </div>
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Novo Template
              </button>
            </div>

            {/* Lista de Templates */}
            {messageTemplates.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={24} className="text-accent" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum template criado</h3>
                <p className="text-muted-foreground mb-4">Crie seu primeiro template de mensagens</p>
                <button
                  onClick={() => setShowTemplateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Criar Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {messageTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-card border-2 border-border hover:border-accent/50 rounded-xl p-4 transition-colors shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                          <FileText size={16} className="text-accent" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground text-sm">{template.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTemplate(template as any);
                            setTemplateForm({
                              name: template.name,
                              content: template.content,
                              preview: template.preview
                            });
                            setShowTemplateModal(true);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-3">{template.preview}</p>
                    
                    <div className="bg-muted/20 rounded-lg p-2 text-xs">
                      <p className="text-muted-foreground line-clamp-3">
                        {template.content.length > 100 ? `${template.content.slice(0, 100)}...` : template.content}
                      </p>
                      
                      {/* Variáveis detectadas no template */}
                      {detectarVariaveis(template.content).length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {detectarVariaveis(template.content).map((variavel, index) => (
                              <span
                                key={index}
                                className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-xs font-mono"
                              >
                                {variavel}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Header Fluxos */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-medium text-foreground">Gerenciar Fluxos</h2>
                <p className="text-sm text-muted-foreground">
                  Crie e organize seus fluxos de mensagens
                </p>
              </div>
              <button
                onClick={() => setShowFluxoModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
              >
                <Plus size={16} />
                Novo Fluxo
              </button>
            </div>

            {/* Lista de Fluxos */}
            {fluxos.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap size={24} className="text-accent" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">Nenhum fluxo criado</h3>
                <p className="text-muted-foreground mb-4">Crie seu primeiro fluxo de mensagens</p>
                <button
                  onClick={() => setShowFluxoModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Criar Fluxo
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {fluxos.map((fluxo) => {
                  const fluxoFrases = frases.filter(f => f.fluxo_id === fluxo.id);
                  const fasesUnicas = [...new Set(fluxoFrases.map(f => f.fase))].sort();
                  const isExpanded = expandedFluxo === fluxo.id;
                  
                  return (
                    <div key={fluxo.id} className="bg-card border-2 border-border hover:border-accent/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                      {/* Header do Fluxo (Sempre Visível) */}
                      <div 
                        className="p-4 cursor-pointer hover:bg-accent/5 transition-colors"
                        onClick={() => setExpandedFluxo(isExpanded ? null : fluxo.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                              <Zap size={20} className="text-accent" />
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-foreground">{fluxo.nome}</h3>
                              <p className="text-sm text-muted-foreground">{fluxo.descricao}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {fluxoFrases.length} mensagens em {fasesUnicas.length} fases
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFraseForm({ ...fraseForm, fluxo_id: fluxo.id });
                                  setShowFraseModal(true);
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                              >
                                <Plus size={14} />
                                Nova Mensagem
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingFluxo(fluxo);
                                  setFluxoForm({
                                    nome: fluxo.nome,
                                    descricao: fluxo.descricao || ''
                                  });
                                  setShowFluxoModal(true);
                                }}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteFluxo(fluxo.id);
                                }}
                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="ml-2">
                              <ChevronDown 
                                size={20} 
                                className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Expandido */}
                      {isExpanded && (
                        <div className="border-t border-border bg-muted/10">
                          <div className="p-6">
                            {fasesUnicas.length === 0 ? (
                              <div className="text-center py-8 bg-muted/20 rounded-xl">
                                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <MessageCircle size={16} className="text-accent" />
                                </div>
                                <h4 className="text-sm font-medium text-foreground mb-2">Nenhuma mensagem neste fluxo</h4>
                                <p className="text-xs text-muted-foreground mb-3">Adicione mensagens para criar seu fluxo</p>
                                <button
                                  onClick={() => {
                                    setFraseForm({ ...fraseForm, fluxo_id: fluxo.id });
                                    setShowFraseModal(true);
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-xs font-medium"
                                >
                                  <Plus size={12} />
                                  Adicionar Mensagem
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-6">
                                {fasesUnicas.map((fase) => {
                                  const fasesFrases = fluxoFrases.filter(f => f.fase === fase).sort((a, b) => a.ordem - b.ordem);
                                  
                                  return (
                                    <div key={fase} className="bg-background border-2 border-border hover:border-accent/30 rounded-lg p-4 transition-colors">
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                          <div className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center">
                                            <Target size={14} className="text-accent" />
                                          </div>
                                          <div>
                                            <h4 className="font-medium text-foreground text-sm">{fase.replace('_', ' ').toUpperCase()}</h4>
                                            <p className="text-xs text-muted-foreground">{fasesFrases.length} mensagens</p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            setFraseForm({ ...fraseForm, fase, fluxo_id: fluxo.id });
                                            setShowFraseModal(true);
                                          }}
                                          className="flex items-center gap-1 px-2 py-1 text-accent hover:bg-accent/10 rounded-lg transition-colors text-xs"
                                        >
                                          <Plus size={12} />
                                          Adicionar
                                        </button>
                                      </div>

                                      <div className="space-y-3">
                                        {fasesFrases.map((frase, index) => (
                                          <div
                                            key={frase.id}
                                            className="bg-muted/20 border border-border/50 rounded-lg p-3"
                                          >
                                            <div className="flex items-start justify-between mb-2">
                                              <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xs font-medium">
                                                  {frase.ordem}
                                                </span>
                                                <div className="text-xs text-muted-foreground">
                                                  {frase.tipo} • {frase.formato}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => openEditFrase(frase)}
                                                  className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded transition-colors"
                                                >
                                                  <Edit3 size={12} />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteFrase(frase.id)}
                                                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                >
                                                  <Trash2 size={12} />
                                                </button>
                                              </div>
                                            </div>

                                            <p className="text-sm text-foreground mb-2">{frase.texto}</p>
                                      
                                      {/* Variáveis detectadas na frase */}
                                      {detectarVariaveis(frase.texto).length > 0 && (
                                        <div className="mb-2">
                                          <div className="flex flex-wrap gap-1">
                                            {detectarVariaveis(frase.texto).map((variavel, index) => (
                                              <span
                                                key={index}
                                                className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-xs font-mono"
                                              >
                                                {variavel}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                              {frase.delay_seconds > 0 && (
                                                <div className="flex items-center gap-1">
                                                  <Clock size={12} />
                                                  {frase.delay_seconds}s
                                                </div>
                                              )}
                                              {(frase.delay_min_seconds > 0 || frase.delay_max_seconds > 0) && (
                                                <div className="flex items-center gap-1">
                                                  <Timer size={12} />
                                                  {frase.delay_min_seconds}s - {frase.delay_max_seconds}s
                                                </div>
                                              )}
                                            </div>

                                            {index < fasesFrases.length - 1 && (
                                              <div className="flex justify-center mt-3">
                                                <ArrowRight size={14} className="text-muted-foreground/50" />
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}


          </div>
        )}
      </div>

      {/* Modal Template */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {editingTemplate ? 'Editar Template' : 'Novo Template'}
                </h2>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    resetTemplateForm();
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome do Template
                  </label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    placeholder="Ex: Primeiro Contato"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm resize-none"
                    rows={3}
                    placeholder="Descreva o objetivo deste template..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveTemplate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  <Save size={16} />
                  Salvar
                </button>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    resetTemplateForm();
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent/5 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Frase */}
      <AnimatePresence>
        {showFraseModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {editingFrase ? 'Editar Mensagem' : 'Nova Mensagem'}
                </h2>
                <button
                  onClick={() => {
                    setShowFraseModal(false);
                    resetFraseForm();
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Fase do Fluxo
                  </label>
                  <select
                    value={fraseForm.fase}
                    onChange={(e) => setFraseForm({ ...fraseForm, fase: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                  >
                    <option value="fase_1">Fase 1</option>
                    <option value="fase_2">Fase 2</option>
                    <option value="fase_3">Fase 3</option>
                    <option value="fase_4">Fase 4</option>
                    <option value="fase_5">Fase 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tipo
                  </label>
                  <select
                    value={fraseForm.tipo}
                    onChange={(e) => setFraseForm({ ...fraseForm, tipo: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                  >
                    <option value="frase1">Frase 1</option>
                    <option value="frase2">Frase 2</option>
                    <option value="frase3">Frase 3</option>
                    <option value="frase4">Frase 4</option>
                    <option value="frase5">Frase 5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Formato
                  </label>
                  <select
                    value={fraseForm.formato}
                    onChange={(e) => setFraseForm({ ...fraseForm, formato: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                  >
                    <option value="text">Texto</option>
                    <option value="image">Imagem</option>
                    <option value="audio">Áudio</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ordem
                  </label>
                  <input
                    type="number"
                    value={fraseForm.ordem}
                    onChange={(e) => setFraseForm({ ...fraseForm, ordem: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    min="1"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Conteúdo da Mensagem
                </label>
                <div className="flex gap-3">
                  <textarea
                    value={fraseForm.texto}
                    onChange={(e) => setFraseForm({ ...fraseForm, texto: e.target.value })}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm resize-none frase-textarea"
                    rows={4}
                    placeholder="Digite o conteúdo da mensagem..."
                  />
                  
                  {/* Variáveis clicáveis */}
                  <div className="w-48 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Variáveis:</p>
                    <div className="space-y-1">
                      {VARIAVEIS_DISPONIVEIS.slice(0, 6).map((item) => (
                        <button
                          key={item.variavel}
                          type="button"
                          onClick={() => {
                            const textarea = document.querySelector('.frase-textarea') as HTMLTextAreaElement;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const newContent = fraseForm.texto.substring(0, start) + item.variavel + fraseForm.texto.substring(end);
                              setFraseForm({ ...fraseForm, texto: newContent });
                              
                              // Focar no textarea e posicionar cursor após a variável
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(start + item.variavel.length, start + item.variavel.length);
                              }, 0);
                            }
                          }}
                          className="w-full text-left px-2 py-1 text-xs bg-accent/10 hover:bg-accent/20 text-accent rounded border border-accent/20 transition-colors"
                        >
                          {item.variavel}
                        </button>
                      ))}
                    </div>
                    
                    {/* Botão "Ver mais" */}
                    <button
                      type="button"
                      onClick={() => {
                        const todasVariaveis = VARIAVEIS_DISPONIVEIS.slice(6).map(item => item.variavel).join('\n');
                        alert(`Variáveis adicionais:\n${todasVariaveis}\n\nClique em uma variável para inseri-la.`);
                      }}
                      className="w-full text-xs text-muted-foreground hover:text-accent transition-colors"
                    >
                      Ver mais...
                    </button>
                  </div>
                </div>
                
                {/* Preview da mensagem */}
                {fraseForm.texto && (
                  <div className="mt-2 p-2 bg-muted/10 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Preview:</p>
                    <p className="text-sm text-foreground">
                      {criarPreview(fraseForm.texto)}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Delay Fixo (segundos)
                  </label>
                  <input
                    type="number"
                    value={fraseForm.delay_seconds}
                    onChange={(e) => setFraseForm({ ...fraseForm, delay_seconds: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Delay Mín. (segundos)
                  </label>
                  <input
                    type="number"
                    value={fraseForm.delay_min_seconds}
                    onChange={(e) => setFraseForm({ ...fraseForm, delay_min_seconds: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Delay Máx. (segundos)
                  </label>
                  <input
                    type="number"
                    value={fraseForm.delay_max_seconds}
                    onChange={(e) => setFraseForm({ ...fraseForm, delay_max_seconds: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-accent text-sm"
                    min="0"
                  />
                </div>
              </div>

              

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveFrase}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors text-sm font-medium"
                >
                  <Save size={16} />
                  Salvar Mensagem
                </button>
                <button
                  onClick={() => {
                    setShowFraseModal(false);
                    resetFraseForm();
                  }}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent/5 transition-colors text-sm"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Fluxo */}
      {showFluxoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">
                {editingFluxo ? 'Editar Fluxo' : 'Novo Fluxo'}
              </h3>
              <button
                onClick={() => setShowFluxoModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Fluxo
                </label>
                <input
                  type="text"
                  value={fluxoForm.nome}
                  onChange={(e) => setFluxoForm({ ...fluxoForm, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Ex: Fluxo Cílios"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descrição
                </label>
                <textarea
                  value={fluxoForm.descricao}
                  onChange={(e) => setFluxoForm({ ...fluxoForm, descricao: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Descreva o propósito deste fluxo"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFluxoModal(false)}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFluxo}
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                {editingFluxo ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Template */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Template
                </label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Ex: Inicial, Intermediário, Recuperação"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Conteúdo da Mensagem
                </label>
                <div className="flex gap-3">
                  <textarea
                    value={templateForm.content}
                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none template-textarea"
                    rows={4}
                    placeholder="Digite o conteúdo da mensagem..."
                  />
                  
                  {/* Variáveis clicáveis */}
                  <div className="w-48 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Variáveis:</p>
                    <div className="space-y-1">
                      {VARIAVEIS_DISPONIVEIS.slice(0, 6).map((item) => (
                        <button
                          key={item.variavel}
                          type="button"
                          onClick={() => {
                            const textarea = document.querySelector('.template-textarea') as HTMLTextAreaElement;
                            if (textarea) {
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const newContent = templateForm.content.substring(0, start) + item.variavel + templateForm.content.substring(end);
                              setTemplateForm({ ...templateForm, content: newContent });
                              
                              // Focar no textarea e posicionar cursor após a variável
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(start + item.variavel.length, start + item.variavel.length);
                              }, 0);
                            }
                          }}
                          className="w-full text-left px-2 py-1 text-xs bg-accent/10 hover:bg-accent/20 text-accent rounded border border-accent/20 transition-colors"
                        >
                          {item.variavel}
                        </button>
                      ))}
                    </div>
                    
                    {/* Botão "Ver mais" */}
                    <button
                      type="button"
                      onClick={() => {
                        // Mostrar todas as variáveis em um modal ou expandir
                        const todasVariaveis = VARIAVEIS_DISPONIVEIS.slice(6).map(item => item.variavel).join('\n');
                        alert(`Variáveis adicionais:\n${todasVariaveis}\n\nClique em uma variável para inseri-la.`);
                      }}
                      className="w-full text-xs text-muted-foreground hover:text-accent transition-colors"
                    >
                      Ver mais...
                    </button>
                  </div>
                </div>
                
                {/* Preview da mensagem */}
                {templateForm.content && (
                  <div className="mt-2 p-2 bg-muted/10 rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-1">Preview:</p>
                    <p className="text-sm text-foreground">
                      {criarPreview(templateForm.content)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Preview/Descrição
                </label>
                <textarea
                  value={templateForm.preview}
                  onChange={(e) => setTemplateForm({ ...templateForm, preview: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Breve descrição do template"
                />
              </div>


            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent/10 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                {editingTemplate ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div> {/* Fechamento da div max-w-7xl mx-auto */}
    </div>
  );
};

export default FluxosPage; 