import React from 'react';
import { useData } from '../context/DataContext';
import { Scissors, Clock, Check, ChevronLeft, Star, Sparkles, User, Coffee, Beer } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../utils';

export default function Services() {
  const { services } = useData();
  const navigate = useNavigate();

  const getServiceIcon = (id: string) => {
    const name = services.find(s => s.id === id)?.name.toLowerCase() || '';
    if (name.includes('corte') && name.includes('barba')) return <Sparkles className="w-6 h-6" />;
    if (name.includes('corte')) return <Scissors className="w-6 h-6" />;
    if (name.includes('barba')) return <User className="w-6 h-6" />;
    return <Star className="w-6 h-6" />;
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-navy-900 relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-gold-500/5 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-12">
          <button 
            onClick={() => navigate('/')}
            className="group text-gray-400 hover:text-gold-500 flex items-center gap-2 text-sm font-medium transition-all"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-gold-500/50 transition-colors">
              <ChevronLeft size={18} />
            </div>
            Voltar ao Início
          </button>
        </div>

        <div className="text-center mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h3 className="text-gold-500 text-[10px] md:text-sm uppercase tracking-[0.3em] md:tracking-[0.4em] mb-3 md:mb-4 font-bold">Menu de Experiências</h3>
            <h1 className="text-4xl md:text-7xl font-serif text-white mb-4 md:mb-6 tracking-tight flex flex-wrap justify-center items-center gap-x-4">
              Nossos <span className="bg-gold-gradient text-navy-900 px-4 py-1 rounded-sm shadow-2xl transform -skew-x-6">Serviços</span>
            </h1>
            <div className="w-16 md:w-24 h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mb-6 md:mb-8"></div>
            <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed italic px-2">
              "Onde a tradição encontra a excelência. Cada detalhe é pensado para elevar sua imagem e proporcionar um momento de relaxamento único."
            </p>
          </motion.div>
        </div>

        {/* Featured Service - Highlight the Combo */}
        {services.find(s => s.id === '3') && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 md:mb-20"
          >
            <div className="glass-panel p-1 group">
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 h-56 md:h-64 lg:h-auto relative overflow-hidden">
                  <img 
                    src={services.find(s => s.id === '3')?.image} 
                    alt="Destaque" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/40 to-transparent hidden lg:block"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent lg:hidden"></div>
                  <div className="absolute top-4 left-4 md:top-6 md:left-6">
                    <span className="bg-gold-500 text-navy-900 text-[10px] md:text-xs font-black px-3 py-1 md:px-4 md:py-1.5 rounded-sm uppercase tracking-[0.15em] md:tracking-[0.2em] shadow-2xl">
                      Assinatura Imperial
                    </span>
                  </div>
                </div>
                <div className="lg:w-1/2 p-6 md:p-12 flex flex-col justify-center">
                  <h2 className="text-2xl md:text-5xl font-serif text-white mb-3 md:mb-4">Corte + Barba <span className="text-gold-500">Premium</span></h2>
                  <p className="text-gray-400 text-sm md:text-lg mb-6 md:mb-8 leading-relaxed">
                    Nossa experiência completa. Inclui corte personalizado, design de barba com toalha quente, 
                    massagem capilar relaxante e finalização com pomada importada.
                  </p>
                  <div className="flex items-center gap-6 md:gap-8 mb-8 md:mb-10">
                    <div>
                      <span className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Duração</span>
                      <span className="text-white text-sm md:text-base font-bold flex items-center gap-2"><Clock size={14} className="text-gold-500" /> 75 MIN</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] uppercase tracking-widest block mb-1">Investimento</span>
                      <span className="text-gold-500 text-2xl md:text-3xl font-bold font-serif">{formatCurrency(services.find(s => s.id === '3')?.price || 50)}</span>
                    </div>
                  </div>
                  <Link 
                    to="/agendar"
                    className="shimmer-btn inline-block w-full md:w-auto px-8 md:px-12 py-4 md:py-5 bg-gold-500 text-navy-900 text-center rounded-sm font-bold hover:bg-gold-400 transition-all uppercase tracking-[0.15em] md:tracking-[0.2em] text-xs md:text-sm shadow-2xl"
                  >
                    Agendar Experiência
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Benefits Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12 md:mb-20">
          {[
            { icon: <Coffee size={18} />, text: "Café" },
            { icon: <Beer size={18} />, text: "Cerveja" },
            { icon: <Sparkles size={18} />, text: "Toalha" },
            { icon: <Star size={18} />, text: "Premium" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 px-2 md:px-6 rounded-xl bg-white/5 border border-white/5 text-gray-300 text-[10px] md:text-sm font-medium">
              <span className="text-gold-500">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-panel group p-1"
            >
              <div className="flex flex-col md:flex-row h-full">
                {/* Image/Icon Section */}
                <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden bg-navy-800 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                    <img 
                      src={service.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop'} 
                      alt={service.name}
                      className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-1000"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent"></div>
                  </div>
                  <div className="relative z-10 w-16 h-16 rounded-full bg-navy-900/80 border border-gold-500/30 flex items-center justify-center text-gold-500 shadow-2xl group-hover:border-gold-500 group-hover:scale-110 transition-all duration-500">
                    {getServiceIcon(service.id)}
                  </div>
                  {index === 0 && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="bg-gold-500 text-navy-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        Mais Procurado
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl md:text-2xl font-serif text-white group-hover:text-gold-500 transition-colors leading-tight">
                        {service.name}
                      </h3>
                      <div className="text-right">
                        <span className="text-gold-500 font-bold text-xl md:text-2xl block leading-none">
                          {formatCurrency(service.price)}
                        </span>
                        <div className="flex items-center justify-end gap-1 text-[9px] md:text-[10px] text-gray-500 uppercase tracking-widest mt-1.5">
                          <Clock size={10} />
                          {service.duration} MIN
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-400 text-xs md:text-sm mb-5 leading-relaxed">
                      {service.description || 'Tratamento completo com técnicas avançadas, lavagem relaxante e finalização personalizada.'}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {['Lavagem', 'Premium', 'Cortesia'].map((tag, i) => (
                        <span key={i} className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link 
                    to="/agendar"
                    className="shimmer-btn w-full py-3.5 md:py-4 bg-gold-500 text-navy-900 text-center rounded-sm font-bold hover:bg-gold-400 transition-all uppercase tracking-[0.15em] md:tracking-[0.2em] text-[10px] md:text-xs shadow-lg"
                  >
                    Reservar Agora
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 text-center p-12 rounded-3xl border border-gold-500/20 bg-gradient-to-b from-white/5 to-transparent"
        >
          <h2 className="text-3xl font-serif text-white mb-6">Não encontrou o que procurava?</h2>
          <p className="text-gray-400 mb-10 max-w-xl mx-auto">
            Oferecemos consultoria personalizada para eventos, casamentos e grupos. Entre em contato para um orçamento exclusivo.
          </p>
          <a 
            href="https://wa.me/558184361210"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-navy-900 transition-all font-bold uppercase tracking-widest text-sm rounded-sm"
          >
            Falar com Especialista
          </a>
        </motion.div>
      </div>
    </div>
  );
}
