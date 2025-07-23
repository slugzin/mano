import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, MessageSquare } from 'lucide-react';
import { templateService, MessageTemplate } from '../../services/templateService';

interface TemplateManagerProps {
  onTemplateSelect?: (template: MessageTemplate) => void;
  showSelectButton?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ 
  onTemplateSelect, 
  showSelectButton = false 
}) => {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    preview: ''
  });

  // Carregar templates
  const loadTemplates = async () => {
    setLoading(true);
    const result = await templateService.listTemplates();
    if (result.success && result.data) {
      setTemplates(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  // Criar template
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.content.trim()) {
      alert('Nome e conteúdo são obrigatórios');
      return;
    }

    const result = await templateService.createTemplate(formData);
    if (result.success) {
      setShowCreateModal(false);
      setFormData({ name: '', content: '', preview: '' });
      loadTemplates();
    } else {
      alert('Erro ao criar template: ' + result.error);
    }
  };

  // Atualizar template
  const handleUpdate = async () => {
    if (!editingTemplate || !formData.name.trim() || !formData.content.trim()) {
      alert('Nome e conteúdo são obrigatórios');
      return;
    }

    const result = await templateService.updateTemplate(editingTemplate.id, formData);
    if (result.success) {
      setEditingTemplate(null);
      setFormData({ name: '', content: '', preview: '' });
      loadTemplates();
    } else {
      alert('Erro ao atualizar template: ' + result.error);
    }
  };

  // Deletar template
  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) return;

    const result = await templateService.deleteTemplate(id);
    if (result.success) {
      loadTemplates();
    } else {
      alert('Erro ao deletar template: ' + result.error);
    }
  };

  // Iniciar edição
  const startEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      preview: template.preview
    });
  };

  // Cancelar edição
  const cancelEdit = () => {
    setEditingTemplate(null);
    setFormData({ name: '', content: '', preview: '' });
  };

  // Selecionar template
  const selectTemplate = (template: MessageTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Templates de Mensagem</h3>
          <span className="text-sm text-muted-foreground">({templates.length})</span>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Template
        </button>
      </div>

      {/* Lista de Templates */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-card border border-border rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{template.name}</h4>
                {template.preview && (
                  <p className="text-sm text-muted-foreground mt-1">{template.preview}</p>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  Criado em {new Date(template.created_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {showSelectButton && (
                  <button
                    onClick={() => selectTemplate(template)}
                    className="px-3 py-1 text-sm bg-accent text-accent-foreground rounded-md hover:bg-accent/80 transition-colors"
                  >
                    Selecionar
                  </button>
                )}
                
                <button
                  onClick={() => startEdit(template)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-md transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                  title="Deletar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview do conteúdo */}
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {template.content}
              </p>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum template criado ainda</p>
            <p className="text-sm">Clique em "Novo Template" para começar</p>
          </div>
        )}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Novo Template</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Template</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Ex: Prospecção Inicial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                <input
                  type="text"
                  value={formData.preview}
                  onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Breve descrição do template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo da Mensagem</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground min-h-[200px] resize-y"
                  placeholder="Digite o conteúdo da mensagem..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                Criar Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Editar Template</h3>
              <button
                onClick={cancelEdit}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome do Template</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Ex: Prospecção Inicial"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                <input
                  type="text"
                  value={formData.preview}
                  onChange={(e) => setFormData({ ...formData, preview: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  placeholder="Breve descrição do template"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Conteúdo da Mensagem</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground min-h-[200px] resize-y"
                  placeholder="Digite o conteúdo da mensagem..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-accent/10 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 