import React from 'react';
import { Instagram, Twitter, Heart } from '../../utils/icons';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-black/90 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-pink-400">Venus</h2>
            <p className="mb-4 text-sm text-gray-400">
              Uma plataforma para criadores se conectarem com seus fãs através de conteúdo exclusivo e experiências personalizadas.
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition">
                <Instagram size={20} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400 transition">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-pink-400 transition">Início</Link>
              </li>
              <li>
                <Link to="/gallery" className="text-gray-400 hover:text-pink-400 transition">Galeria</Link>
              </li>
              <li>
                <Link to="/book" className="text-gray-400 hover:text-pink-400 transition">Agendar Chamada</Link>
              </li>
              <li>
                <Link to="/subscribe" className="text-gray-400 hover:text-pink-400 transition">Assinar</Link>
              </li>
            </ul>
          </div>

          {/* Ajuda */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">Ajuda</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-pink-400 transition">Termos de Uso</Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-400 hover:text-pink-400 transition">Política de Privacidade</Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-pink-400 transition">Fale Conosco</Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-400 hover:text-pink-400 transition">FAQ</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p className="flex justify-center items-center gap-2">
            Feito com <Heart size={14} className="text-pink-500 fill-pink-500" /> © {new Date().getFullYear()} Venus
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;