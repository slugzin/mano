import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronRight,
  Target,
  Users,
  Phone,
  Grid,
  MessageCircle,
  Clock,
  Rocket,
  BarChart3,
  Building
} from '../../utils/icons';
import { ThemeSwitcher } from '../../components/ui/ThemeSwitcher';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    {
      icon: <LayoutDashboard size={20} />,
      label: 'Dashboard',
      path: '/admin',
      gradient: 'from-blue-500 to-purple-500'
    },
    {
      icon: <Target size={20} />,
      label: 'Leads',
      path: '/admin/leads',
      gradient: 'from-green-500 to-blue-500'
    },
    {
      icon: <Users size={20} />,
      label: 'Empresas',
      path: '/admin/empresas',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Phone size={20} />,
      label: 'Conexões',
      path: '/admin/conexoes',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <Rocket size={20} />,
      label: 'Disparos',
      path: '/admin/disparos',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <MessageCircle size={20} />,
      label: 'Conversas',
      path: '/admin/conversas',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Clock size={20} />,
      label: 'Histórico',
      path: '/admin/campanhas',
      gradient: 'from-amber-500 to-yellow-500'
    },
    {
      icon: <BarChart3 size={20} />,
      label: 'Fluxos',
      path: '/admin/fluxos',
      gradient: 'from-purple-500 to-pink-500'
    }
  ];

  // Bottom navigation bar para mobile
  const bottomNavItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dash', path: '/admin' },
    { icon: <Target size={20} />, label: 'Leads', path: '/admin/leads' },
    { icon: <Rocket size={20} />, label: 'Disparos', path: '/admin/disparos' },
    { icon: <Building size={20} />, label: 'Empresas', path: '/admin/empresas' },
    { icon: <Clock size={20} />, label: 'Histórico', path: '/admin/campanhas' },
  ];

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Fica como está, já que usa 'fixed' e não interfere no fluxo flex */}
      <aside 
        className={`
          fixed top-0 left-0 h-full bg-card 
          backdrop-blur-xl border-r border-border transition-all duration-300 ease-in-out z-40
          ${isExpanded ? 'w-64' : 'w-20'}
          hidden md:block
        `}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Efeito de brilho */}
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5 pointer-events-none"></div>
        
        <div className="h-full flex flex-col relative">
          <div className={`
            p-4 border-b border-border flex items-center gap-3
            ${isExpanded ? 'justify-between' : 'justify-center'}
          `}>
            <Link to="/" className="flex items-center gap-2 min-w-0 group">
              <div className="relative">
                <span className="text-3xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  {isExpanded ? 'Prospect' : 'P'}
                </span>
                <Target size={12} className="absolute -top-1 -right-1 text-accent animate-pulse" />
              </div>
              {isExpanded && (
                <span className="text-xs text-accent bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/30 px-2 py-1 rounded-lg backdrop-blur-sm">
                  CRM
                </span>
              )}
            </Link>
            {isExpanded && (
              <ThemeSwitcher size="sm" />
            )}
          </div>

          <nav className="flex-1 py-6">
            <ul className={`space-y-2 ${isExpanded ? 'px-3' : 'px-2'}`}>
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`
                        flex items-center rounded-xl transition-all duration-300
                        group relative overflow-hidden backdrop-blur-sm
                        ${isExpanded ? 'gap-3 px-3 py-3' : 'justify-center px-2 py-3'}
                        ${isActive
                          ? 'text-foreground bg-accent/10 border border-accent/20 shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent/5 border border-transparent hover:border-border'
                        }
                      `}
                    >
                      <div className={`flex items-center z-10 relative ${isExpanded ? 'gap-3 min-w-0' : 'justify-center'}`}>
                        <div className={`
                          p-2 rounded-lg transition-all duration-300 flex-shrink-0
                          ${isActive 
                            ? `bg-accent shadow-sm` 
                            : 'bg-muted group-hover:bg-accent/10'
                          }
                        `}>
                          {React.cloneElement(item.icon, { 
                            className: isActive ? 'text-accent-foreground' : 'text-muted-foreground group-hover:text-foreground' 
                          })}
                        </div>
                        {isExpanded && (
                          <span className="whitespace-nowrap transition-all duration-300 font-medium overflow-hidden opacity-100 w-auto">
                            {item.label}
                          </span>
                        )}
                      </div>
                      
                      {/* Efeito de hover animado */}
                      <div className={`
                        absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0
                        transition-all duration-500 transform scale-x-0 origin-left
                        group-hover:opacity-5 group-hover:scale-x-100
                        ${isActive ? 'opacity-5 scale-x-100' : ''}
                      `} />
                      
                      {/* Indicador ativo */}
                      {isActive && isExpanded && (
                        <div className="absolute right-2 w-2 h-2 bg-accent rounded-full animate-pulse"></div>
                      )}
                      
                      {/* Indicador ativo para sidebar colapsada */}
                      {isActive && !isExpanded && (
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-accent rounded-l-full"></div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={`p-3 border-t border-border ${!isExpanded ? 'px-2' : ''}`}>
            <button
              onClick={() => {}}
              className={`
                flex items-center w-full text-muted-foreground 
                hover:text-foreground hover:bg-destructive/10 
                rounded-xl transition-all duration-300 group border border-transparent
                hover:border-destructive/20 backdrop-blur-sm
                ${isExpanded ? 'gap-3 px-3 py-3 justify-start' : 'justify-center px-2 py-3'}
              `}
            >
              <div className="p-2 bg-muted group-hover:bg-destructive rounded-lg transition-all duration-300 flex-shrink-0">
                <LogOut size={20} className="group-hover:text-destructive-foreground" />
              </div>
              {isExpanded && (
                <span className="transition-all duration-300 font-medium overflow-hidden opacity-100 w-auto">
                  Sair
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Botão de expansão com efeito */}
        <div className={`
          absolute top-1/2 -right-3 transform -translate-y-1/2
          transition-all duration-300 z-10
          ${isExpanded ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
        `}>
          <div className="bg-accent rounded-full p-2 shadow-lg shadow-accent/25 hover:shadow-accent/40 transition-all duration-300 hover:scale-110">
            <ChevronRight size={16} className="text-accent-foreground" />
          </div>
        </div>
      </aside>

      {/* page-wrapper: Novo container para o conteúdo da página */}
      <div className="flex flex-1 flex-col overflow-hidden md:ml-20">
        {/* Main Content: Agora é o container com scroll */}
        <main className="page-content-scrollable flex-1 overflow-y-auto overflow-x-hidden pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation Bar - Fica como está */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 
        bg-card/95 backdrop-blur-lg border-t border-border
        z-50 h-16
      ">
        <div className="flex justify-between items-center h-full px-2">
          {bottomNavItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`
                flex flex-col items-center justify-center
                ${location.pathname === item.path ? 'text-primary' : 'text-muted-foreground'}
                transition-colors duration-200 hover:text-primary
                w-16 h-full
              `}
            >
              {item.icon}
              <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;