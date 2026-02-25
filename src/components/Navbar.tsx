import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Scissors, Calendar, MapPin, User, LogIn, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Serviços', path: '/servicos' },
    { name: 'Agendar', path: '/agendar' },
    { name: 'Sobre', path: '/sobre' },
    { name: 'Localização', path: '/localizacao' },
  ];

  return (
    <nav className={cn(
      "fixed w-full z-50 transition-all duration-500",
      scrolled ? "bg-navy-900/70 backdrop-blur-md md:backdrop-blur-2xl border-b border-white/10 py-2 shadow-2xl" : "bg-transparent py-4"
    )}>
      {/* Subtle grain overlay for the navbar when scrolled - Hidden on mobile */}
      {scrolled && (
        <div className="hidden md:block absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'var(--background-image-texture)' }}></div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
               <div className="absolute inset-0 border border-gold-500/30 rounded-full group-hover:border-gold-500 transition-colors duration-500"></div>
               <span className="font-serif text-2xl sm:text-3xl text-gold-500 font-bold drop-shadow-lg">I</span>
               <div className="absolute -top-1.5 sm:-top-2 text-gold-500 w-3 h-3 sm:w-4 sm:h-4 animate-pulse">
                 <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                   <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" />
                   <path d="M5 18H19V20H5V18Z" />
                 </svg>
               </div>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl text-white font-bold tracking-widest leading-none group-hover:text-gold-400 transition-colors">
                IMPERIAL
              </span>
              <span className="font-sans text-[0.55rem] sm:text-[0.65rem] text-gold-500 tracking-[0.2em] sm:tracking-[0.3em] uppercase leading-none">
                BARBEARIA
              </span>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 hover:text-gold-400",
                    location.pathname === link.path ? "text-gold-500" : "text-gray-300"
                  )}
                >
                  {link.name}
                </Link>
              ))}
              <Link to="/admin" className="text-gray-500 hover:text-gold-500 transition-colors">
                <LogIn size={18} />
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1">
            <Link 
              to="/login" 
              className="text-gray-500/40 hover:text-gold-500 transition-colors p-2"
              title="Acesso Rápido"
            >
              <Lock size={18} />
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gold-500 hover:text-white transition-colors p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-navy-900/95 backdrop-blur-xl border-t border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-xl text-lg font-medium transition-all duration-300",
                      location.pathname === link.path 
                        ? "text-gold-500 bg-gold-500/10 border border-gold-500/20" 
                        : "text-gray-300 hover:text-gold-400 hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center border transition-colors",
                      location.pathname === link.path ? "bg-gold-500 text-navy-900 border-gold-500" : "bg-navy-800 text-gold-500 border-white/5"
                    )}>
                      {link.name === 'Home' && <User size={20} />}
                      {link.name === 'Serviços' && <Scissors size={20} />}
                      {link.name === 'Agendar' && <Calendar size={20} />}
                      {link.name === 'Sobre' && <MapPin size={20} />}
                      {link.name === 'Localização' && <MapPin size={20} />}
                    </div>
                    <span className="tracking-wide">{link.name}</span>
                    {location.pathname === link.path && (
                      <div className="ml-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold-500 shadow-[0_0_8px_rgba(212,175,55,0.8)]"></div>
                      </div>
                    )}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="pt-4 mt-4 border-t border-white/5"
              >
                <Link 
                  to="/admin" 
                  className="flex items-center gap-4 px-4 py-3 text-gray-500 hover:text-gold-500 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center border border-white/5">
                    <Lock size={20} />
                  </div>
                  <span className="text-xs uppercase tracking-widest font-bold">Área Administrativa</span>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
