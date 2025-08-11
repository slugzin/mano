import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from '../../utils/icons';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'O que é o CaptaZap e como funciona?',
    answer: 'O CaptaZap é uma plataforma completa de automação de prospecção que combina busca inteligente de empresas com disparo automático de mensagens no WhatsApp. Você define o tipo de empresa que procura (ex: "restaurantes em São Paulo"), nossa IA encontra os dados de contato e você pode criar campanhas automáticas de WhatsApp para esses leads.'
  },
  {
    id: '2',
    question: 'Quantas empresas posso captar e mensagens posso enviar?',
    answer: 'Isso depende do seu plano: o Plano Gratuito permite captar até 50 empresas por mês e enviar 100 mensagens. O Plano Básico oferece até 500 empresas e 1.000 mensagens mensais. Já o Plano Premium não tem limite de empresas e permite até 10.000 mensagens por mês, ideal para operações em grande escala.'
  },
  {
    id: '3',
    question: 'É seguro usar o CaptaZap? Vou ser banido do WhatsApp?',
    answer: 'Sim, é totalmente seguro! O CaptaZap utiliza a API oficial do WhatsApp Business e segue todas as boas práticas de envio. Temos recursos como controle de intervalo entre mensagens, limite de disparos por hora e templates personalizáveis para manter sua conta sempre em conformidade com as políticas do WhatsApp.'
  },
  {
    id: '4',
    question: 'Posso conectar múltiplas contas do WhatsApp?',
    answer: 'Sim! Dependendo do seu plano, você pode conectar múltiplas instâncias do WhatsApp. O Plano Gratuito permite 1 conexão, o Básico até 3 conexões e o Premium até 10 conexões simultâneas. Isso é ideal para empresas que operam com diferentes números ou setores.'
  },
  {
    id: '5',
    question: 'Como funciona o suporte e existe período de teste?',
    answer: 'Oferecemos diferentes níveis de suporte: email no plano gratuito, suporte prioritário no básico e suporte 24/7 no premium. Você pode começar gratuitamente e testar todas as funcionalidades. Não há período de teste limitado - o plano gratuito já permite que você experimente o sistema e upgrade quando precisar de mais recursos.'
  }
];

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Nós estamos aqui para te ajudar
        </h2>
        <p className="text-xl text-gray-400">
          Perguntas frequentes sobre o nosso serviço
        </p>
      </div>

      <div className="space-y-4">
        {faqData.map((item) => {
          const isOpen = openItems.includes(item.id);
          
          return (
            <div 
              key={item.id}
              className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-600"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-800/70 transition-colors duration-200"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {item.question}
                </h3>
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </button>
              
              {isOpen && (
                <div className="px-6 pb-6">
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-gray-300 leading-relaxed mt-4">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <p className="text-gray-400 mb-4">
          Ainda tem dúvidas? Entre em contato conosco!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="mailto:suporte@captazap.com.br"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            Enviar Email
          </a>
          <a 
            href="https://wa.me/5511999999999"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ; 