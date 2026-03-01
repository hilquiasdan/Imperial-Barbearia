import React from 'react';
import { MapPin, Clock, Phone, Navigation, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Location() {
  const navigate = useNavigate();

  return (
    <div className="pt-24 pb-20 min-h-screen bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <button 
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <ChevronLeft size={20} /> Voltar ao Início
          </button>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif text-white mb-4">Localização</h1>
          <div className="w-24 h-1 bg-gold-500 mx-auto mb-6"></div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Fácil acesso no coração da cidade. Estacionamento conveniado disponível.
          </p>
        </div>

        <div className="bg-navy-800 rounded-2xl overflow-hidden shadow-2xl border border-white/5 flex flex-col lg:flex-row">
          <div className="lg:w-1/3 p-8 md:p-12 flex flex-col justify-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4 group">
                <div className="bg-gold-500/10 p-4 rounded-xl text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900 transition-colors">
                  <MapPin size={28} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Endereço</h3>
                  <p className="text-gray-400">Av. Dr. Ivo Queirós, 86 - São Vicente de Paulo<br/>Vitória de Santo Antão - PE<br/>CEP: 55604-270</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="bg-gold-500/10 p-4 rounded-xl text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900 transition-colors">
                  <Clock size={28} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Horário</h3>
                  <p className="text-gray-400">Segunda a Sexta: 09:00 - 20:00</p>
                  <p className="text-gray-400">Sábado: 09:00 - 18:00</p>
                  <p className="text-gray-400 text-red-400">Domingo: Fechado</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="bg-gold-500/10 p-4 rounded-xl text-gold-500 group-hover:bg-gold-500 group-hover:text-navy-900 transition-colors">
                  <Phone size={28} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Contato</h3>
                  <p className="text-gray-400">(81) 8436-1210</p>
                  <p className="text-gray-400">hilquiasdaniel.g16@gmail.com</p>
                </div>
              </div>
            </div>

            <a 
              href="https://www.google.com/maps/place/Av.+Dr.+Ivo+Queir%C3%B3s,+86+-+S%C3%A3o+Vicente+de+Paulo,+Vit%C3%B3ria+de+Santo+Ant%C3%A3o+-+PE,+55604-270/@-8.1229234,-35.2995975,17z" 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-10 w-full py-4 bg-gold-500 text-navy-900 font-bold rounded-xl hover:bg-gold-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gold-500/20"
            >
              <Navigation size={20} />
              Traçar Rota
            </a>
          </div>
          
          <div className="lg:w-2/3 min-h-[400px] bg-navy-900 relative">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3946.543412345678!2d-35.301789!3d-8.122923!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7aa54a126a36085%3A0xad1447a57abecbd0!2sAv.%20Dr.%20Ivo%20Queir%C3%B3s%2C%2086%20-%20S%C3%A3o%20Vicente%20de%20Paulo%2C%20Vit%C3%B3ria%20de%20Santo%20Ant%C3%A3o%20-%20PE%2C%2055604-270!5e0!3m2!1spt-BR!2sbr!4v1709280000000!5m2!1spt-BR!2sbr" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}
