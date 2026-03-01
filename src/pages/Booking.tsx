import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { format, addDays, startOfToday, setHours, setMinutes, isBefore, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  User, 
  Scissors, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft, 
  Clock,
  Sparkles,
  Palette,
  Eye,
  Smile,
  PenTool,
  Droplets,
  Sun,
  Wind,
  HeartHandshake,
  Trash2
} from 'lucide-react';
import { useData, Appointment } from '../context/DataContext';
import { formatCurrency, cn } from '../utils';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { services, addAppointment, appointments, barbers } = useData();
  
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState<'new' | 'portal'>('new');
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(searchParams.get('service'));
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Generate next 14 days
  const days = Array.from({ length: 14 }, (_, i) => addDays(startOfToday(), i));

  // Memoize occupied slots for the selected date and barber
  const occupiedSlots = useMemo(() => {
    if (!selectedBarber) return new Set<string>();
    
    return new Set(
      appointments
        .filter(appt => {
          if (appt.status === 'cancelled') return false;
          if (appt.barberId !== selectedBarber) return false;
          const apptDate = new Date(appt.date);
          return isEqual(startOfToday(), startOfToday()) && // This is just to trigger re-render if needed
                 format(apptDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        })
        .map(appt => format(new Date(appt.date), 'HH:mm'))
    );
  }, [appointments, selectedBarber, selectedDate]);

  // Generate time slots (09:00 to 19:00) - Memoized
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let i = 9; i < 19; i++) {
      slots.push(`${i.toString().padStart(2, '0')}:00`);
      slots.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, []);

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleConfirm = () => {
    if (!selectedBarber || !selectedService || !selectedTime || !customerName) return;

    const service = services.find(s => s.id === selectedService);
    const barber = barbers.find(b => b.id === selectedBarber);
    
    // Create ISO date string from selected date and time
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const appointmentDate = setHours(setMinutes(selectedDate, minutes), hours);

    addAppointment({
      barberId: selectedBarber,
      serviceId: selectedService,
      date: appointmentDate.toISOString(),
      clientName: customerName,
      clientPhone: customerPhone,
      price: service?.price || 0,
    });

    // Send WhatsApp Message
    const message = `Olá, Imperial Barbearia! \u{1F44B}\n\nGostaria de confirmar um novo agendamento. Seguem os detalhes:\n\n------------------------------------\n\u{1F464} *Cliente:* ${customerName}\n\u{1F4F1} *Telefone:* ${customerPhone}\n------------------------------------\n\u{2702}\u{FE0F} *Serviço:* ${service?.name}\n\u{1F4B0} *Valor:* ${formatCurrency(service?.price || 0)}\n\u{23F1}\u{FE0F} *Duração:* ${service?.duration} min\n------------------------------------\n\u{1F488} *Profissional:* ${barber?.name}\n\u{1F4C5} *Data:* ${format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })}\n\u{23F0} *Horário:* ${format(appointmentDate, "HH:mm", { locale: ptBR })}\n------------------------------------\n\nAguardo a confirmação. Obrigado! \u{1F44A}`;
    
    // Open WhatsApp in new tab (simulating sending to owner)
    window.open(`https://wa.me/${barber?.phone || '558184361210'}?text=${encodeURIComponent(message)}`, '_blank');

    // Reset and show success (or redirect)
    alert('Agendamento realizado com sucesso!');
    navigate('/');
  };

  const isSlotOccupied = (time: string) => {
    return occupiedSlots.has(time);
  };

  const getStepTitle = () => {
    if (activeTab === 'portal') return "Meus Agendamentos";
    switch(step) {
      case 1: return "Escolha o Barbeiro";
      case 2: return "Escolha o Serviço";
      case 3: return "Data e Horário";
      case 4: return "Confirmação";
      default: return "";
    }
  };

  const getServiceIcon = (id: string) => {
    const name = services.find(s => s.id === id)?.name.toLowerCase() || '';
    if (name.includes('corte') && name.includes('barba')) return <Sparkles size={24} />;
    if (name.includes('corte')) return <Scissors size={24} />;
    if (name.includes('barba')) return <User size={24} />;
    if (name.includes('limpeza')) return <Sparkles size={24} />;
    if (name.includes('luzes') || name.includes('platinado')) return <Sun size={24} />;
    return <Scissors size={24} />;
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-navy-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-navy-800/50 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header & Progress */}
        <div className="mb-8 md:mb-12 text-center">
          <div className="flex justify-between items-center mb-6">
            <button 
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <ChevronLeft size={20} /> <span className="hidden sm:inline">Voltar ao Início</span>
            </button>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-gold-500 font-bold border border-gold-500/20">I</div>
            <div className="w-20"></div> {/* Spacer */}
          </div>

          <h1 className="text-2xl md:text-4xl font-serif text-white mb-6">
            {activeTab === 'new' ? 'Agende seu Horário' : 'Portal do Cliente'}
          </h1>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-10">
            <div className="bg-navy-800/50 p-1 rounded-xl border border-white/5 flex gap-1">
              <button
                onClick={() => setActiveTab('new')}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  activeTab === 'new' ? "bg-gold-500 text-navy-900 shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                Novo Agendamento
              </button>
              <button
                onClick={() => setActiveTab('portal')}
                className={cn(
                  "px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                  activeTab === 'portal' ? "bg-gold-500 text-navy-900 shadow-lg" : "text-gray-400 hover:text-white"
                )}
              >
                Meus Agendamentos
              </button>
            </div>
          </div>

          {activeTab === 'new' ? (
            <>
              {/* New Progress Steps - Desktop Only */}
              <div className="hidden md:flex justify-between items-center max-w-2xl mx-auto relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-navy-800 -z-10 transform -translate-y-1/2"></div>
                <div 
                  className="absolute top-1/2 left-0 h-0.5 bg-gold-500 -z-10 transform -translate-y-1/2 transition-all duration-500"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>

                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <motion.div 
                      initial={false}
                      animate={{ 
                        scale: step === s ? 1.1 : 1,
                        backgroundColor: step >= s ? '#D4AF37' : '#1a202c',
                        borderColor: step >= s ? '#D4AF37' : '#2d3748'
                      }}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10",
                        step >= s ? "text-navy-900 shadow-[0_0_10px_rgba(212,175,55,0.3)]" : "text-gray-500 border-navy-700 bg-navy-900"
                      )}
                    >
                      {s === 1 && <User size={14} />}
                      {s === 2 && <Scissors size={14} />}
                      {s === 3 && <CalendarIcon size={14} />}
                      {s === 4 && <CheckCircle size={14} />}
                    </motion.div>
                    <span className={cn(
                      "text-xs font-medium uppercase tracking-wider hidden md:block transition-colors duration-300",
                      step >= s ? "text-gold-500" : "text-gray-600"
                    )}>
                      {s === 1 && "Profissional"}
                      {s === 2 && "Serviço"}
                      {s === 3 && "Data"}
                      {s === 4 && "Confirmar"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mobile Progress Bar */}
              <div className="md:hidden max-w-xs mx-auto">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gold-500 font-bold">Passo {step} de 4</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{getStepTitle()}</span>
                </div>
                <div className="h-1 w-full bg-navy-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(step / 4) * 100}%` }}
                    className="h-full bg-gold-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400 max-w-md mx-auto text-sm">Consulte seus horários agendados e gerencie seus compromissos com facilidade.</p>
          )}
        </div>

        <div className="glass-panel backdrop-blur-sm md:backdrop-blur-2xl rounded-2xl md:rounded-3xl border border-white/10 p-4 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-h-[450px] md:min-h-[500px] relative overflow-hidden group">
          {/* Subtle grain overlay for the panel - Now visible on mobile */}
          <div className="absolute inset-0 opacity-[0.02] md:opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-700" style={{ backgroundImage: 'var(--background-image-texture)' }}></div>
          
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-bl from-gold-500/20 to-transparent rounded-bl-full pointer-events-none"></div>

          <AnimatePresence mode="wait">
            {activeTab === 'portal' ? (
              <ClientPortal key="portal" />
            ) : (
              <>
                {/* STEP 1: BARBER */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {barbers.map((barber) => (
                  <motion.div 
                    key={barber.id}
                    onClick={() => setSelectedBarber(barber.id)}
                    whileHover={{ scale: 1.02, translateY: -5 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "cursor-pointer rounded-2xl border transition-all duration-300 relative group p-6 flex items-center gap-6 overflow-hidden",
                      selectedBarber === barber.id 
                        ? "border-gold-500 bg-gradient-to-br from-navy-900 to-navy-800 shadow-[0_10px_30px_rgba(0,0,0,0.3)]" 
                        : "border-white/5 hover:border-gold-500/30 bg-navy-900/40 hover:bg-navy-900/60"
                    )}
                  >
                    {selectedBarber === barber.id && (
                      <div className="absolute inset-0 bg-gold-500/5 pointer-events-none"></div>
                    )}
                    
                    <div className={cn(
                      "w-24 h-24 md:w-40 md:h-40 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 border-2 overflow-hidden relative",
                      selectedBarber === barber.id ? "border-gold-500 shadow-lg" : "border-white/10 group-hover:border-gold-500/50"
                    )}>
                      {barber.image ? (
                        <img 
                          src={barber.image} 
                          alt={barber.name} 
                          className={cn(
                            "w-full h-full object-cover",
                            barber.name === 'Leomar' ? "object-[center_20%]" : "object-center"
                          )}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.classList.add('bg-navy-800');
                              // Add a fallback icon if not already present
                              if (!parent.querySelector('.fallback-icon')) {
                                const iconContainer = document.createElement('div');
                                iconContainer.className = "fallback-icon w-full h-full flex items-center justify-center text-gray-500";
                                iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
                                parent.appendChild(iconContainer);
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className={cn("w-full h-full flex items-center justify-center", selectedBarber === barber.id ? "bg-gold-500 text-navy-900" : "bg-navy-800 text-gray-500 group-hover:text-gold-500")}>
                          <User size={40} className="md:hidden" />
                          <User size={60} className="hidden md:block" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={cn("text-lg md:text-xl font-bold mb-1 transition-colors", selectedBarber === barber.id ? "text-gold-500" : "text-white")}>{barber.name}</h3>
                      <p className="text-xs md:text-sm text-gray-400 mb-2 md:mb-3">Master Barber</p>
                      
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span key={star} className="text-gold-500 text-xs">★</span>
                        ))}
                      </div>
                    </div>

                    {selectedBarber === barber.id && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 text-gold-500"
                      >
                        <CheckCircle size={24} />
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* STEP 2: SERVICE */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 max-h-[60vh] md:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
              >
                {services.map((service) => (
                  <motion.div
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden",
                      selectedService === service.id 
                        ? "bg-white/5 border-gold-500 shadow-[0_4px_20px_rgba(0,0,0,0.2)]" 
                        : "bg-navy-900/40 border-white/5 hover:border-gold-500/30"
                    )}
                  >
                    {selectedService === service.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-500 z-20"></div>
                    )}

                    {/* Background image for service card */}
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity z-0">
                      <img src={service.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-r from-navy-900 via-navy-900/60 to-transparent"></div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-5 relative z-10">
                      <div className={cn(
                        "w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner",
                        selectedService === service.id ? "bg-gold-500 text-navy-900" : "bg-navy-800 text-gold-500 group-hover:bg-navy-700"
                      )}>
                        {getServiceIcon(service.id)}
                      </div>
                      <div>
                        <h3 className={cn("font-bold text-base md:text-lg mb-0.5 md:mb-1", selectedService === service.id ? "text-gold-500" : "text-white")}>{service.name}</h3>
                        <p className="text-[10px] md:text-sm text-gray-400 flex items-center gap-2">
                          <span className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[10px] md:text-xs"><Clock size={10} /> {service.duration} min</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right relative z-10">
                      <span className="block font-bold text-white text-base md:text-xl mb-0.5 md:mb-1">{formatCurrency(service.price)}</span>
                      {selectedService === service.id ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <CheckCircle size={20} className="text-gold-500 ml-auto" />
                        </motion.div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-white/10 ml-auto"></div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* STEP 3: DATE & TIME */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                {/* Date Selector */}
                <div>
                  <h3 className="text-white mb-6 flex items-center gap-3 font-medium text-lg">
                    <div className="w-8 h-8 rounded bg-gold-500/10 flex items-center justify-center text-gold-500">
                      <CalendarIcon size={18}/>
                    </div>
                    Selecione a Data
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar px-1">
                    {days.map((date) => {
                      const isSelectedExact = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                      
                      return (
                        <motion.button
                          key={date.toString()}
                          onClick={() => setSelectedDate(date)}
                          whileHover={{ scale: 1.05, translateY: -5 }}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "flex-shrink-0 w-20 h-28 md:w-24 md:h-32 rounded-2xl flex flex-col items-center justify-center border transition-all relative overflow-hidden group",
                            isSelectedExact 
                              ? "bg-gradient-to-b from-gold-500 to-gold-600 text-navy-900 border-gold-500 shadow-[0_10px_20px_rgba(212,175,55,0.3)]" 
                              : "bg-navy-900 border-white/10 text-gray-400 hover:border-gold-500/50 hover:text-white hover:bg-navy-800"
                          )}
                        >
                          <span className="text-[10px] uppercase font-bold tracking-widest mb-1 opacity-80">{format(date, 'EEE', { locale: ptBR })}</span>
                          <span className="text-3xl md:text-4xl font-serif font-bold mb-1">{format(date, 'd')}</span>
                          <span className="text-[10px] font-medium uppercase tracking-wider bg-black/10 px-2 py-0.5 rounded">{format(date, 'MMM', { locale: ptBR })}</span>
                          
                          {isSelectedExact && (
                            <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Selector */}
                <div>
                  <h3 className="text-white mb-6 flex items-center gap-3 font-medium text-lg">
                    <div className="w-8 h-8 rounded bg-gold-500/10 flex items-center justify-center text-gold-500">
                      <Clock size={18}/>
                    </div>
                    Selecione o Horário
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {timeSlots.map((time) => {
                      const occupied = isSlotOccupied(time);
                      return (
                        <motion.button
                          key={time}
                          disabled={occupied}
                          onClick={() => setSelectedTime(time)}
                          whileHover={!occupied ? { scale: 1.05 } : { x: [0, -2, 2, -2, 2, 0] }}
                          whileTap={!occupied ? { scale: 0.95 } : { scale: 0.98 }}
                          className={cn(
                            "py-4 rounded-xl text-sm font-bold border transition-all relative overflow-hidden group",
                            selectedTime === time 
                              ? "bg-gold-500 text-navy-900 border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.3)]" 
                              : occupied 
                                ? "bg-navy-900/40 text-gray-600 border-red-500/20 cursor-not-allowed"
                                : "bg-navy-900 text-white border-white/10 hover:border-gold-500/50 hover:bg-navy-800"
                          )}
                        >
                          <span className={cn(occupied && "opacity-20")}>{time}</span>
                          
                          {occupied && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              {/* Diagonal Banner */}
                              <div className="absolute top-0 right-0 transform translate-x-[30%] -translate-y-[20%] rotate-45 bg-red-600 text-white text-[8px] font-black py-1 px-8 shadow-lg z-10 uppercase tracking-tighter">
                                Indisponível
                              </div>
                              
                              {/* Central Badge */}
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded backdrop-blur-sm"
                              >
                                <span className="text-[9px] font-black uppercase tracking-widest text-red-500">
                                  Ocupado
                                </span>
                              </motion.div>
                              
                              {/* Subtle Red Glow on Hover */}
                              <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: CONFIRMATION */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                {/* Ticket Summary */}
                <div className="bg-white text-navy-900 rounded-2xl overflow-hidden shadow-2xl relative scale-90 sm:scale-100 origin-top">
                  {/* Ticket Header */}
                  <div className="bg-navy-900 p-4 md:p-6 text-center border-b-4 border-gold-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <h3 className="text-gold-500 font-serif text-xl md:text-2xl font-bold tracking-widest">IMPERIAL</h3>
                    <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-[0.3em]">Barbearia</p>
                  </div>
                  
                  {/* Ticket Body */}
                  <div className="p-4 md:p-6 space-y-4 md:space-y-6 relative">
                    {/* Perforated Line Effect */}
                    <div className="absolute top-0 left-0 w-full transform -translate-y-1/2 flex justify-between px-2">
                       {Array.from({ length: 8 }).map((_, i) => (
                         <div key={i} className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-navy-800"></div>
                       ))}
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                        <div className="text-left">
                          <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Profissional</p>
                          <p className="font-bold text-base md:text-lg">{barbers.find(b => b.id === selectedBarber)?.name}</p>
                        </div>
                        <User size={18} className="text-gold-600 mb-1" />
                      </div>
                      
                      <div className="flex justify-between items-end border-b border-gray-200 pb-2">
                        <div className="text-left">
                          <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Serviço</p>
                          <p className="font-bold text-base md:text-lg">{services.find(s => s.id === selectedService)?.name}</p>
                        </div>
                        <Scissors size={18} className="text-gold-600 mb-1" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-b border-gray-200 pb-2">
                          <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Data</p>
                          <p className="font-bold text-base md:text-lg">{format(selectedDate, "dd/MM", { locale: ptBR })}</p>
                        </div>
                        <div className="border-b border-gray-200 pb-2 text-right">
                          <p className="text-[10px] md:text-xs text-gray-500 uppercase tracking-wider mb-1">Horário</p>
                          <p className="font-bold text-base md:text-lg">{selectedTime}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 md:p-4 rounded-xl flex justify-between items-center mt-2 md:mt-4 border border-gray-100">
                      <span className="text-sm md:text-base text-gray-600 font-medium">Total</span>
                      <span className="text-xl md:text-2xl font-bold text-navy-900">
                        {formatCurrency(services.find(s => s.id === selectedService)?.price || 0)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Barcode Decoration */}
                  <div className="bg-gray-100 p-4 flex justify-center opacity-50">
                    <div className="h-8 w-full bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH4gYRFg4y7W89twAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAAADElEQVQI12NggAIAAAwAAwq64r8AAAAASUVORK5CYII=')] bg-repeat-x bg-contain"></div>
                  </div>
                </div>

                {/* Form */}
                <div className="flex flex-col justify-center space-y-6">
                  <div className="text-center md:text-left mb-4">
                    <h3 className="text-2xl font-bold text-white mb-2">Quase lá!</h3>
                    <p className="text-gray-400">Preencha seus dados para finalizarmos o agendamento.</p>
                  </div>

                  <div className="space-y-5">
                    <div className="group">
                      <label className="block text-sm text-gold-500 mb-2 ml-1 font-medium uppercase tracking-wider">Seu Nome</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-navy-900/50 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-gold-500 focus:bg-navy-900 focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                          placeholder="Digite seu nome completo"
                        />
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-gold-500 transition-colors" size={20} />
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm text-gold-500 mb-2 ml-1 font-medium uppercase tracking-wider">Seu WhatsApp</label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          value={customerPhone}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 11) val = val.slice(0, 11);
                            
                            // Apply mask: (00) 00000-0000
                            let masked = val;
                            if (val.length > 2) masked = `(${val.slice(0, 2)}) ${val.slice(2)}`;
                            if (val.length > 7) masked = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
                            
                            setCustomerPhone(masked);
                          }}
                          className="w-full bg-navy-900/50 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-gold-500 focus:bg-navy-900 focus:outline-none transition-all focus:shadow-[0_0_20px_rgba(212,175,55,0.1)]"
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-gold-500 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
              </>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          {activeTab === 'new' && (
            <div className="mt-8 md:mt-12 flex flex-col sm:flex-row justify-between pt-6 md:pt-8 border-t border-white/5 gap-4">
              <button
                onClick={handleBack}
                disabled={step === 1}
                className={cn(
                  "px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group order-2 sm:order-1",
                  step === 1 ? "text-gray-600 cursor-not-allowed opacity-0" : "text-gray-400 hover:text-white"
                )}
              >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Voltar
              </button>

              {step < 4 ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !selectedBarber) ||
                    (step === 2 && !selectedService) ||
                    (step === 3 && !selectedTime)
                  }
                  className="px-8 md:px-10 py-4 bg-gold-500 text-navy-900 rounded-xl font-bold hover:bg-gold-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] order-1 sm:order-2"
                >
                  Próximo Passo <ChevronRight size={20} />
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={!customerName || !customerPhone}
                  className="px-8 md:px-10 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)] order-1 sm:order-2"
                >
                  Confirmar Agendamento <CheckCircle size={20} />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientPortal() {
  const { appointments, cancelAppointment, getBarberName, getServiceName, barbers } = useData();
  const [phone, setPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const cleanPhone = phone.replace(/\D/g, '');
  
  const searchResult = useMemo(() => {
    if (!hasSearched || cleanPhone.length < 10) return null;
    return appointments.filter(a => {
      const aPhone = a.clientPhone.replace(/\D/g, '');
      return aPhone === cleanPhone;
    });
  }, [appointments, hasSearched, cleanPhone]);

  const handleSearch = () => {
    if (cleanPhone.length < 10) {
      alert('Por favor, digite um número de telefone válido.');
      return;
    }
    setHasSearched(true);
  };

  const handleCancel = async (id: string, clientName: string, serviceName: string, date: string, barberId: string) => {
    // Removed confirm dialog as per user request for immediate action
    try {
      // 1. Update system first and wait for confirmation
      const success = await cancelAppointment(id);
      
      if (success) {
        // 2. Prepare WhatsApp message
        const dateObj = new Date(date);
        const dateStr = format(dateObj, "dd/MM/yyyy", { locale: ptBR });
        const timeStr = format(dateObj, "HH:mm", { locale: ptBR });
        
        const barber = barbers.find(b => b.id === barberId);
        const barberPhone = barber?.phone || '558184361210';
        
        const message = `*SOLICITAÇÃO DE CANCELAMENTO*\n\nOlá, gostaria de cancelar meu agendamento:\n\n*Cliente:* ${clientName}\n*Serviço:* ${serviceName}\n*Data:* ${dateStr}\n*Hora:* ${timeStr}\n\nO horário já foi liberado no sistema.`;
        const whatsappUrl = `https://wa.me/${barberPhone}?text=${encodeURIComponent(message)}`;

        // 3. Open WhatsApp
        const win = window.open(whatsappUrl, '_blank');
        if (!win) {
          window.location.href = whatsappUrl;
        }
      } else {
        alert('Não foi possível cancelar o agendamento. Por favor, tente novamente.');
      }
    } catch (error) {
      console.error("Error cancelling:", error);
      alert('Ocorreu um erro ao processar o cancelamento.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center text-gold-500 mx-auto mb-4 border border-gold-500/20">
          <CalendarIcon size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Meus Agendamentos</h2>
        <p className="text-gray-400">Digite seu WhatsApp para consultar seus horários.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <div className="flex-1 relative">
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '');
              if (val.length > 11) val = val.slice(0, 11);
              let masked = val;
              if (val.length > 2) masked = `(${val.slice(0, 2)}) ${val.slice(2)}`;
              if (val.length > 7) masked = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
              setPhone(masked);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-navy-900/50 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-gold-500 focus:outline-none transition-all"
            placeholder="(00) 00000-0000"
          />
          <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
        </div>
        <button
          onClick={handleSearch}
          className="px-8 py-4 bg-gold-500 text-navy-900 rounded-xl font-bold hover:bg-gold-400 transition-all shadow-lg"
        >
          Consultar
        </button>
      </div>

      <AnimatePresence mode="wait">
        {hasSearched && searchResult && searchResult.length > 0 ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {searchResult.map((appt) => (
              <div 
                key={appt.id}
                className={cn(
                  "p-6 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-center gap-6",
                  appt.status === 'cancelled' ? "bg-navy-900/20 border-white/5 opacity-60" : "bg-white/5 border-white/10"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    appt.status === 'cancelled' ? "bg-gray-800 text-gray-500" : "bg-gold-500/10 text-gold-500"
                  )}>
                    <Scissors size={24} />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{getServiceName(appt.serviceId)}</h4>
                    <p className="text-gray-400 text-sm">{getBarberName(appt.barberId)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gold-500 font-medium flex items-center gap-1">
                        <CalendarIcon size={12} /> {format(new Date(appt.date), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      <span className="text-xs text-gold-500 font-medium flex items-center gap-1">
                        <Clock size={12} /> {format(new Date(appt.date), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {appt.status === 'cancelled' ? (
                    <span className="text-xs font-bold uppercase tracking-widest text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      Cancelado
                    </span>
                  ) : (
                    <>
                      <span className="text-xs font-bold uppercase tracking-widest text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                        Confirmado
                      </span>
                      <button
                        onClick={() => handleCancel(appt.id, appt.clientName, getServiceName(appt.serviceId), appt.date, appt.barberId)}
                        className="text-red-500 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-wider border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                      >
                        Cancelar Agendamento
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        ) : hasSearched ? (
          <motion.div 
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-navy-900/30 rounded-3xl border border-dashed border-white/10"
          >
            <div className="text-gray-500 mb-4 flex justify-center">
              <CalendarIcon size={48} className="opacity-20" />
            </div>
            <p className="text-gray-400">Nenhum agendamento encontrado para este número.</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
