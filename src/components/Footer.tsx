import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-navy-900 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          
          {/* Brand */}
          <div className="col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center border border-gold-500 rounded-full bg-navy-800">
                <span translate="no" className="font-serif text-xl text-gold-500 font-bold notranslate">I</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl text-white font-bold tracking-widest leading-none">
                  IMPERIAL
                </span>
                <span className="font-sans text-[0.6rem] text-gold-500 tracking-[0.3em] uppercase leading-none">
                  BARBEARIA
                </span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              A barbearia que define o padrão de excelência. Tradição, estilo e um ambiente exclusivo para o homem moderno.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm border-b border-gold-500/30 pb-2 inline-block">Menu</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li><Link to="/" className="hover:text-gold-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>Home</Link></li>
              <li><Link to="/servicos" className="hover:text-gold-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>Serviços</Link></li>
              <li><Link to="/agendar" className="hover:text-gold-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>Agendar</Link></li>
              <li><Link to="/sobre" className="hover:text-gold-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>Sobre Nós</Link></li>
              <li><Link to="/localizacao" className="hover:text-gold-500 transition-colors flex items-center gap-2"><span className="w-1 h-1 bg-gold-500 rounded-full opacity-0 hover:opacity-100 transition-opacity"></span>Localização</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm border-b border-gold-500/30 pb-2 inline-block">Contato</h3>
            <ul className="space-y-4 text-gray-400 text-sm">
              <li className="flex flex-col">
                <span className="text-xs text-gold-500 uppercase tracking-wide mb-1">Telefone / WhatsApp</span>
                <a href="https://wa.me/558184361210" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  (81) 8436-1210
                </a>
              </li>
              <li className="flex flex-col">
                <span className="text-xs text-gold-500 uppercase tracking-wide mb-1">Email</span>
                <a href="mailto:hilquiasdaniel.g16@gmail.com" className="hover:text-white transition-colors">
                  hilquiasdaniel.g16@gmail.com
                </a>
              </li>
              <li className="flex flex-col">
                <span className="text-xs text-gold-500 uppercase tracking-wide mb-1">Endereço</span>
                <span>Av. Dr. Ivo Queirós, 86 - São Vicente de Paulo<br/>Vitória de Santo Antão - PE</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-bold mb-6 uppercase tracking-wider text-sm border-b border-gold-500/30 pb-2 inline-block">Siga-nos</h3>
            <div className="flex space-x-4 mb-8">
              <a href="https://www.instagram.com/imperialbarbearia01_/" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-navy-800 border border-white/5 flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-navy-900 hover:border-gold-500 transition-all duration-300 transform hover:-translate-y-1">
                <Instagram size={24} />
              </a>
              <a href="https://www.facebook.com/profile.php?id=61563903786667&locale=pt_BR" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-navy-800 border border-white/5 flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-navy-900 hover:border-gold-500 transition-all duration-300 transform hover:-translate-y-1">
                <Facebook size={24} />
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Fique por dentro das novidades e promoções exclusivas seguindo nossas redes sociais.
            </p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p className="text-center md:text-left">&copy; {new Date().getFullYear()} Imperial Barbearia. Todos os direitos reservados.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-gold-500 transition-colors">Termos de Uso</a>
            <a href="#" className="hover:text-gold-500 transition-colors">Privacidade</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
