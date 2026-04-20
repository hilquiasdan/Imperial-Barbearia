import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, Scissors, Info } from 'lucide-react';

export default function Home() {
  const { scrollY } = useScroll();
  
  // Disable parallax on mobile for better performance
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  
  const y1 = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
        {/* Background with Parallax/Texture */}
        <motion.div className="absolute inset-0 z-0" style={{ y: y1 }}>
          <div className="absolute inset-0 bg-navy-900/75 z-10"></div>
          {/* Grain overlay - Hidden on mobile for performance */}
          <div className="absolute inset-0 z-15 hidden md:block opacity-20 pointer-events-none" style={{ backgroundImage: 'var(--background-image-texture)' }}></div>
          <img 
            src={`https://images.unsplash.com/photo-1503951914875-befbb6470523?q=80&w=${isMobile ? 800 : 2068}&auto=format&fit=crop`} 
            alt="Barbershop Background" 
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900/60 via-transparent to-navy-900 z-20"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(11,29,53,0.8)_100%)] z-25"></div>
        </motion.div>

        {/* Content */}
        <motion.div className="relative z-30 text-center px-4 max-w-4xl mx-auto" style={{ opacity }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-8"
          >
            {/* 3D Logo Effect */}
            <div className="w-40 h-40 md:w-48 md:h-48 mx-auto mb-6 md:mb-8 relative group perspective-1000">
              {/* Outer Glow Ring - Hidden on mobile */}
              {!isMobile && (
                <motion.div 
                  className="absolute inset-[-15px] rounded-full opacity-10 blur-3xl bg-gold-500"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.05, 0.15, 0.05] 
                  }}
                  transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                />
              )}

              {/* Secondary Rotating Ring - Hidden on mobile */}
              {!isMobile && (
                <div className="absolute inset-[-5px] rounded-full border border-gold-500/10 z-0">
                  <motion.div 
                    className="absolute inset-0 rounded-full border border-dashed border-gold-500/30"
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                  />
                </div>
              )}

              {/* Primary Rotating Border Light */}
              <div className="absolute inset-0 rounded-full z-0">
                <motion.div 
                  className="absolute inset-0 rounded-full border-t-2 border-gold-500/60 shadow-[0_0_20px_rgba(212,175,55,0.4)]"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                />
              </div>

              <motion.div 
                className="w-full h-full rounded-full border-[3px] border-gold-500/40 flex items-center justify-center bg-navy-900/95 backdrop-blur-sm md:backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.6)] group-hover:shadow-[0_0_100px_rgba(197,160,89,0.4)] transition-all duration-1000 relative overflow-hidden z-10"
                animate={{ 
                  y: [0, -6, 0],
                  // Only do 3D rotation on desktop for better mobile performance
                  rotateY: !isMobile ? [0, 6, 0, -6, 0] : 0,
                  rotateX: !isMobile ? [0, -4, 0, 4, 0] : 0
                }}
                transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              >
                {/* Grain overlay for the logo circle - Hidden on mobile */}
                <div className="absolute inset-0 hidden md:block opacity-10 pointer-events-none" style={{ backgroundImage: 'var(--background-image-texture)' }}></div>
                
                {/* Glint effect - Hidden on mobile */}
                {!isMobile && (
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full -skew-x-12"
                    animate={{ translateX: ['200%', '-200%'] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 3 }}
                  />
                )}

                {/* Inner Laurel/Wreath border */}
                <div className="absolute inset-3 border border-gold-500/10 rounded-full flex items-center justify-center">
                  <div className="w-full h-full border border-dashed border-gold-500/5 rounded-full animate-spin-slow"></div>
                </div>
                
                <div className="text-center z-10 transform group-hover:scale-105 transition-transform duration-1000">
                  <div className="text-gold-500 text-6xl md:text-7xl font-serif font-bold relative">
                    <span translate="no" className="relative z-10 drop-shadow-[0_0_20px_rgba(212,175,55,0.8)] notranslate">I</span>
                    
                    {/* Crown with more elegant float */}
                    <motion.div 
                      className="absolute -top-8 md:-top-10 left-1/2 transform -translate-x-1/2 w-8 h-8 md:w-10 md:h-10 text-gold-500 filter drop-shadow-[0_0_20px_rgba(212,175,55,1)]"
                      animate={{ 
                        y: [0, -4, 0],
                        rotate: [0, 5, 0, -5, 0]
                      }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" />
                        <path d="M5 18H19V20H5V18Z" />
                      </svg>
                    </motion.div>

                    {/* Twinkling Stars */}
                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 flex gap-3 text-[10px] md:text-xs text-gold-500">
                      <motion.span animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0 }}>★</motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}>★</motion.span>
                      <motion.span animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }}>★</motion.span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <h1 className="text-4xl md:text-8xl font-serif font-bold text-white mb-2 tracking-wide drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
              <span className="text-gold-gradient">IMPERIAL</span>
            </h1>
            <h2 className="text-lg md:text-3xl font-sans font-medium text-gold-500 tracking-[0.3em] md:tracking-[0.5em] uppercase mb-8 md:mb-10 text-shadow-sm opacity-90">
              Barbearia
            </h2>
            <p className="text-gray-300 text-base md:text-xl italic font-light mb-8 md:mb-10 max-w-2xl mx-auto px-4 leading-relaxed">
              "Cortes de elite para homens de respeito."
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link to="/agendar">
                <motion.button
                  whileHover={{ 
                    scale: 1.02, 
                    translateY: -2, 
                    boxShadow: "0 10px 25px rgba(197, 160, 89, 0.3)",
                    filter: "brightness(1.05)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="px-10 py-4 gold-gradient-depth text-navy-900 font-bold rounded-sm uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex items-center gap-3 shimmer-btn"
                >
                  <Calendar size={20} />
                  Agendar Horário
                </motion.button>
              </Link>
              
              <Link to="/servicos">
                <motion.button
                  whileHover={{ 
                    scale: 1.02, 
                    translateY: -2, 
                    backgroundColor: "rgba(197, 160, 89, 0.08)",
                    borderColor: "rgba(197, 160, 89, 0.6)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="px-10 py-4 bg-transparent border-2 border-gold-500/50 text-gold-500 font-bold rounded-sm uppercase tracking-widest hover:bg-gold-500/10 hover:border-gold-500 transition-all flex items-center gap-3"
                >
                  <Scissors size={20} />
                  Serviços
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gold-500 z-30"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-gold-500 rounded-full flex justify-center p-1">
            <div className="w-1 h-2 bg-gold-500 rounded-full"></div>
          </div>
        </motion.div>
      </section>

      {/* Intro Section */}
      <section className="py-32 bg-navy-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h3 className="text-gold-500 text-lg uppercase tracking-widest mb-2">Bem-vindo à Imperial Barbearia</h3>
              <h2 className="text-4xl font-serif text-white mb-6">A Arte de Cuidar da Sua Imagem</h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Na Imperial Barbearia, não vendemos apenas cortes de cabelo, entregamos confiança e estilo. 
                Nosso ambiente foi projetado para o homem moderno que valoriza a tradição e o conforto.
                Relaxe com uma cerveja gelada enquanto nossos mestres barbeiros cuidam do seu visual.
              </p>
              <Link to="/sobre" className="text-gold-500 border-b border-gold-500 pb-1 hover:text-white hover:border-white transition-colors inline-flex items-center gap-2">
                Conheça nossa história <Info size={16} />
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 border-2 border-gold-500/30 rounded-lg transform rotate-3"></div>
              <img 
                src={`https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=${isMobile ? 800 : 2070}&auto=format&fit=crop`} 
                alt="Interior Barbearia" 
                className="rounded-lg shadow-2xl relative z-10 md:grayscale md:hover:grayscale-0 transition-all duration-500"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop';
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
