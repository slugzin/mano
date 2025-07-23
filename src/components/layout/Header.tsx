import React, { useState, useEffect } from 'react';
import { Menu, X, User, Bell, LogOut } from '../../utils/icons';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useApp();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/90 backdrop-blur-sm' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center">
                      <span className="text-pink-400 text-2xl font-bold">Privadinho</span>
            <span className="text-gray-400 text-sm ml-2">Espaço da putaria</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white hover:text-pink-300 transition">
            Início
          </Link>
          <Link to="/gallery" className="text-white hover:text-pink-300 transition">
            Galeria
          </Link>
          <Link to="/book" className="text-white hover:text-pink-300 transition">
            Agendar Chamada
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Link to="/notifications" className="text-white hover:text-pink-300">
                <Bell size={20} />
              </Link>
              <Link to="/profile" className="text-white hover:text-pink-300">
                <User size={20} />
              </Link>
              <button 
                onClick={logout}
                className="text-white hover:text-pink-300"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Entrar
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link 
              to="/" 
              className="text-white hover:text-pink-300 py-2 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              to="/gallery" 
              className="text-white hover:text-pink-300 py-2 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Galeria
            </Link>
            <Link 
              to="/book" 
              className="text-white hover:text-pink-300 py-2 transition"
              onClick={() => setIsMenuOpen(false)}
            >
              Agendar Chamada
            </Link>
            {isAuthenticated ? (
              <div className="flex flex-col space-y-4">
                <Link 
                  to="/profile" 
                  className="text-white hover:text-pink-300 py-2 transition flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User size={20} /> Perfil
                </Link>
                <Link 
                  to="/notifications" 
                  className="text-white hover:text-pink-300 py-2 transition flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Bell size={20} /> Notificações
                </Link>
                <button 
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="text-white hover:text-pink-300 py-2 transition flex items-center gap-2"
                >
                  <LogOut size={20} /> Sair
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md transition-colors w-full text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;