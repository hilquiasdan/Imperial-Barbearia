import React from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Phone, Clock, ChevronLeft } from 'lucide-react';
import { REVIEWS } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();
  
  return (
    <div className="pt-24 pb-20 min-h-screen bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <button 
          onClick={() => navigate('/')}
          className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <ChevronLeft size={20} /> Voltar ao Início
        </button>
      </div>
      
      {/* History Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h1 className="text-4xl font-serif text-white mb-6">Nossa História</h1>
            <div className="w-20 h-1 bg-gold-500 mb-8"></div>
            <p className="text-gray-400 leading-relaxed mb-4">
              Fundada em 2018, a Imperial Barbearia nasceu do desejo de resgatar a clássica experiência das barbearias de antigamente, unindo-a às técnicas modernas e a um ambiente de alto padrão.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Nossa missão é proporcionar mais do que um corte de cabelo: oferecemos um momento de pausa, relaxamento e cuidado pessoal para o homem que valoriza sua imagem. Com toalhas quentes, navalhas afiadas e produtos de primeira linha, garantimos a excelência em cada detalhe.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <img src="https://images.unsplash.com/photo-1503951914875-befbb6470523?q=80&w=2068&auto=format&fit=crop" className="rounded-lg shadow-lg mt-8" alt="Barbearia 1" />
            <img src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=2070&auto=format&fit=crop" className="rounded-lg shadow-lg" alt="Barbearia 2" />
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="bg-navy-800 py-20 mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif text-center text-white mb-12">O que dizem nossos clientes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {REVIEWS.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-navy-900 p-6 rounded-xl border border-white/5 hover:border-gold-500/30 transition-colors"
              >
                <div className="flex text-gold-500 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-700"} />
                  ))}
                </div>
                <p className="text-gray-300 italic mb-4">"{review.text}"</p>
                <p className="text-white font-bold text-sm">- {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-800 rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex flex-col md:flex-row">
          <div className="md:w-1/2 p-8 md:p-12">
            <h2 className="text-3xl font-serif text-white mb-8">Localização</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-gold-500/10 p-3 rounded-lg text-gold-500">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Endereço</h3>
                  <p className="text-gray-400">Av. São José, S/N - Alto José Leal<br/>Vitória de Santo Antão - PE<br/>CEP: 55608-080</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gold-500/10 p-3 rounded-lg text-gold-500">
                  <Clock size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Horário de Funcionamento</h3>
                  <p className="text-gray-400">Seg - Sex: 09:00 - 20:00</p>
                  <p className="text-gray-400">Sáb: 09:00 - 18:00</p>
                  <p className="text-gray-400">Dom: Fechado</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-gold-500/10 p-3 rounded-lg text-gold-500">
                  <Phone size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold mb-1">Contato</h3>
                  <p className="text-gray-400">(81) 98133-3889</p>
                  <p className="text-gray-400">contato@imperialbarbearia.com</p>
                </div>
              </div>
            </div>

            <button className="mt-8 w-full py-3 bg-gold-500 text-navy-900 font-bold rounded-lg hover:bg-gold-400 transition-colors">
              Como Chegar
            </button>
          </div>
          
          <div className="md:w-1/2 min-h-[300px] bg-navy-900 relative">
            {/* Placeholder for Google Maps */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3946.696783664654!2d-35.30645528521796!3d-8.111719594158425!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7aa53ad40c81cd1%3A0xae282148dfbceb30!2sImperial%20Barbearia%20%7C%20Corte%20Masculino%20e%20Barba%20em%20Vit%C3%B3ria%20de%20Santo%20Ant%C3%A3o!5e0!3m2!1sen!2sbr!4v1708800000000!5m2!1sen!2sbr" 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'grayscale(100%) invert(92%) contrast(83%)' }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
