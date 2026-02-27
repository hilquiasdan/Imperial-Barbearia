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
                  <p className="text-gray-400">Av. São José, S/N - Alto José Leal<br/>Vitória de Santo Antão - PE<br/>CEP: 55608-080</p>
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
              href="https://www.google.com/maps/dir/-8.1133568,-35.3107968/Imperial+Barbearia+%7C+Corte+Masculino+e+Barba+em+Vit%C3%B3ria+de+Santo+Ant%C3%A3o,+Av.+S%C3%A3o+Jos%C3%A9,+S%2FN+-+Alto+Jos%C3%A9+Leal,+Vit%C3%B3ria+de+Santo+Ant%C3%A3o+-+PE,+55608-080/@-8.1125234,-35.3129586,16z/data=!3m1!4b1!4m9!4m8!1m1!4e1!1m5!1m1!1s0x7aa53ad40c81cd1:0xae282148dfbceb30!2m2!1d-35.3042666!2d-8.1117196?entry=ttu&g_ep=EgoyMDI2MDIyMi4wIKXMDSoASAFQAw%3D%3D" 
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3946.696783664654!2d-35.30645528521796!3d-8.111719594158425!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x7aa53ad40c81cd1%3A0xae282148dfbceb30!2sImperial%20Barbearia%20%7C%20Corte%20Masculino%20e%20Barba%20em%20Vit%C3%B3ria%20de%20Santo%20Ant%C3%A3o!5e0!3m2!1sen!2sbr!4v1708800000000!5m2!1sen!2sbr" 
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
