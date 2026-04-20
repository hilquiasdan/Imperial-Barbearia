import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData, Appointment, Service, Barber } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils';
import { 
  LogOut, Calendar as CalendarIcon, Users, Settings, BarChart2, Menu, X, Bell, 
  Trash2, Edit, Plus, Download, DollarSign, Scissors, TrendingUp, UserCheck, Clock, History,
  ChevronLeft, ChevronRight, Filter, List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  isToday, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils';

export default function Admin() {
  const { logout, user, token } = useAuth();
  const { 
    appointments, services, barbers, 
    cancelAppointment, deleteAppointment, deleteAppointmentsByMonth,
    addService, updateService, deleteService,
    addBarber, updateBarber, deleteBarber,
    getBarberName, getServiceName 
  } = useData();
  const navigate = useNavigate();

  // Filter appointments based on user role
  const filteredAppointments = useMemo(() => {
    if (user?.role === 'owner') return appointments;
    return appointments.filter(a => a.barberId === user?.barberId);
  }, [appointments, user]);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState(new Date().toISOString().slice(0, 7));
  
  // Calendar & Filter States
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [selectedListDate, setSelectedListDate] = useState(new Date());

  const { toggleAttended } = useData();

  // --- PWA Install Logic ---
  const [canInstall, setCanInstall] = useState(!!(window as any).deferredPrompt);

  useEffect(() => {
    const handleInstallReady = () => setCanInstall(true);
    window.addEventListener('pwa-install-ready', handleInstallReady);
    return () => window.removeEventListener('pwa-install-ready', handleInstallReady);
  }, []);

  const handleInstall = async () => {
    const promptEvent = (window as any).deferredPrompt;
    if (!promptEvent) return;
    
    promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    (window as any).deferredPrompt = null;
    setCanInstall(false);
  };

  // --- Dashboard Logic ---
  const dashboardMetrics = useMemo(() => {
    const activeAppointments = filteredAppointments.filter(a => a.status !== 'cancelled');
    const now = new Date();
    
    // Filter by period
    const periodAppointments = activeAppointments.filter(a => {
      const d = parseISO(a.date);
      if (chartPeriod === 'day') {
        return isSameDay(d, now);
      } else if (chartPeriod === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 0 });
        const end = endOfWeek(now, { weekStartsOn: 0 });
        return d >= start && d <= end;
      } else if (chartPeriod === 'month') {
        return isSameMonth(d, now);
      }
      return true;
    });

    const totalRevenue = periodAppointments.reduce((sum, a) => sum + a.price, 0);
    const totalAppointments = periodAppointments.length;
    const averageTicket = totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

    const todayAppointments = activeAppointments.filter(a => isSameDay(parseISO(a.date), now));
    const periodAttended = periodAppointments.filter(a => a.attended).length;

    const periodLabel = chartPeriod === 'day' ? 'Hoje' : chartPeriod === 'week' ? 'Esta Semana' : 'Este Mês';

    return {
      totalRevenue,
      totalAppointments,
      averageTicket,
      todayCount: todayAppointments.length,
      todayRevenue: todayAppointments.reduce((sum, a) => sum + a.price, 0),
      todayAttended: todayAppointments.filter(a => a.attended).length,
      periodAttended,
      periodLabel
    };
  }, [filteredAppointments, chartPeriod]);

  const chartData = useMemo(() => {
    const groupedData: Record<string, { [key: string]: any }> = {};
    
    // Sort appointments by date
    const sortedApps = [...filteredAppointments]
      .filter(a => a.status !== 'cancelled')
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());

    // If period is month, pre-fill all months of the current year
    if (chartPeriod === 'month') {
      const currentYear = new Date().getFullYear();
      for (let i = 1; i <= 12; i++) {
        const date = new Date(currentYear, i - 1);
        const key = format(date, 'MMM', { locale: ptBR });
        groupedData[key] = { date: key };
        barbers.forEach(b => {
          groupedData[key][b.name.toLowerCase()] = 0;
        });
      }
    }

    // If period is day, pre-fill last 7 days
    if (chartPeriod === 'day') {
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = format(date, 'dd/MM');
        groupedData[key] = { date: key };
        barbers.forEach(b => {
          groupedData[key][b.name.toLowerCase()] = 0;
        });
      }
    }

    // If period is week, pre-fill last 4 weeks
    if (chartPeriod === 'week') {
      const now = new Date();
      for (let i = 3; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        const start = startOfWeek(date, { weekStartsOn: 0 });
        const key = `Sem ${format(start, 'dd/MM')}`;
        groupedData[key] = { date: key };
        barbers.forEach(b => {
          groupedData[key][b.name.toLowerCase()] = 0;
        });
      }
    }

    sortedApps.forEach(app => {
      const appDate = parseISO(app.date);
      let key = '';

      if (chartPeriod === 'day') {
        key = format(appDate, 'dd/MM');
      } else if (chartPeriod === 'week') {
        const start = startOfWeek(appDate, { weekStartsOn: 0 });
        key = `Sem ${format(start, 'dd/MM')}`;
      } else {
        key = format(appDate, 'MMM', { locale: ptBR });
      }

      if (groupedData[key]) {
        const barberName = getBarberName(app.barberId).toLowerCase();
        if (groupedData[key][barberName] !== undefined) {
          groupedData[key][barberName] += app.price;
        }
      }
    });

    const result = Object.values(groupedData);
    
    // Sort by date if it's month view to ensure Jan-Dec order
    if (chartPeriod === 'month') {
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      return result.sort((a, b) => months.indexOf(a.date) - months.indexOf(b.date));
    }
    
    return result;
  }, [filteredAppointments, chartPeriod, getBarberName, barbers]);

  const pieData = useMemo(() => {
    const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];
    const data = barbers.map((b, i) => ({
      name: b.name,
      value: 0,
      color: colors[i % colors.length]
    }));

    const now = new Date();
    const periodAppointments = filteredAppointments.filter(app => {
      if (app.status === 'cancelled') return false;
      const d = parseISO(app.date);
      if (chartPeriod === 'day') return isSameDay(d, now);
      if (chartPeriod === 'week') {
        const start = startOfWeek(now, { weekStartsOn: 0 });
        const end = endOfWeek(now, { weekStartsOn: 0 });
        return d >= start && d <= end;
      }
      if (chartPeriod === 'month') return isSameMonth(d, now);
      return true;
    });

    periodAppointments.forEach(app => {
      const barberIndex = barbers.findIndex(b => b.id === app.barberId);
      if (barberIndex !== -1) {
        data[barberIndex].value += app.price;
      }
    });

    return data.filter(d => d.value > 0);
  }, [filteredAppointments, barbers, chartPeriod]);

  const exportCSV = () => {
    const headers = ['Data', 'Cliente', 'Serviço', 'Barbeiro', 'Valor', 'Status'];
    const rows = filteredAppointments.map(app => [
      format(parseISO(app.date), 'dd/MM/yyyy'),
      app.clientName,
      getServiceName(app.serviceId),
      getBarberName(app.barberId),
      app.price,
      app.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "agendamentos_imperial.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Appointments Logic ---
  const filteredAppointmentsList = useMemo(() => {
    let list = filteredAppointments.filter(a => a.status !== 'cancelled');
    
    // Filter by selected date for list view
    list = list.filter(a => isSameDay(parseISO(a.date), selectedListDate));

    if (selectedBarberFilter !== 'all') {
      list = list.filter(a => a.barberId === selectedBarberFilter);
    }
    
    return list.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [filteredAppointments, selectedBarberFilter, selectedListDate]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentCalendarDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentCalendarDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentCalendarDate]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    // Use filteredAppointments (filtered by barber but NOT by day) for the calendar view
    const calendarList = filteredAppointments.filter(a => 
      a.status !== 'cancelled' && 
      (selectedBarberFilter === 'all' || a.barberId === selectedBarberFilter)
    );
    
    calendarList.forEach(app => {
      const dayKey = format(parseISO(app.date), 'yyyy-MM-dd');
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(app);
    });
    return map;
  }, [filteredAppointments, selectedBarberFilter]);

  const historyAppointments = useMemo(() => {
    return filteredAppointments
      .filter(app => {
        const appMonth = format(parseISO(app.date), 'yyyy-MM');
        return appMonth === selectedHistoryMonth;
      })
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  }, [filteredAppointments, selectedHistoryMonth]);

  const availableMonths = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const months = new Set<string>();
    
    // Add all months of current year
    for (let i = 1; i <= 12; i++) {
      months.add(`${currentYear}-${i.toString().padStart(2, '0')}`);
    }
    
    // Also add months from appointments (in case they are from other years)
    filteredAppointments.forEach(app => {
      months.add(format(parseISO(app.date), 'yyyy-MM'));
    });
    
    return Array.from(months).sort().reverse();
  }, [filteredAppointments]);

  const handleDeleteMonth = async () => {
    const [year, m] = selectedHistoryMonth.split('-');
    const date = new Date(Number(year), Number(m) - 1);
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    if (window.confirm(`Tem certeza que deseja excluir TODOS os agendamentos de ${label}? Esta ação não pode ser desfeita.`)) {
      const success = await deleteAppointmentsByMonth(selectedHistoryMonth);
      if (success) {
        alert(`Agendamentos de ${label} excluídos com sucesso.`);
      } else {
        alert('Erro ao excluir agendamentos.');
      }
    }
  };

  const handleCancel = async (e: React.MouseEvent, app: Appointment) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Deseja realmente CANCELAR o agendamento de ${app.clientName} e enviar mensagem de aviso?`)) {
      return;
    }

    try {
      // 1. Prepare WhatsApp notification
      const clientPhone = app.clientPhone || '';
      let cleanedPhone = clientPhone.replace(/\D/g, '');
      
      // Remove leading zero if present (common in Brazil)
      if (cleanedPhone.startsWith('0')) {
        cleanedPhone = cleanedPhone.substring(1);
      }
      
      // Ensure 55 prefix for Brazil
      let phoneWithCountry = cleanedPhone;
      if (cleanedPhone.length > 0 && !cleanedPhone.startsWith('55')) {
        phoneWithCountry = `55${cleanedPhone}`;
      }
      
      const dateObj = parseISO(app.date);
      const dateStr = dateObj.toLocaleDateString('pt-BR');
      const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const serviceName = getServiceName(app.serviceId);
      const barberName = getBarberName(app.barberId);
      
    const message = `*IMPERIAL BARBEARIA*\n\nPrezado(a) *${app.clientName}*,\n\nLamentamos informar que seu agendamento de *${serviceName}* com o profissional *${barberName}* para o dia ${dateStr} às ${timeStr} precisou ser cancelado.\n\nPedimos sinceras desculpas pelo inconveniente. Gostaríamos de convidá-lo(a) a realizar um novo agendamento através do nosso site.\n\nAtenciosamente,\n*Equipe Imperial Barbearia*`;
      
      const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
      
      // 2. Delete from database first to ensure it's gone
      console.log(`Cancelando e excluindo agendamento: ${app.id}`);
      const deleted = await deleteAppointment(app.id);
      
      if (deleted) {
        console.log('Agendamento excluído com sucesso do banco de dados.');
        // 3. Open WhatsApp
        const win = window.open(whatsappUrl, '_blank');
        if (!win) {
          console.log('window.open bloqueado, tentando fallback com link temporário...');
          // If popup is blocked, we use a temporary link to avoid navigating the whole app
          const link = document.createElement('a');
          link.href = whatsappUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        alert('Agendamento cancelado e excluído com sucesso!');
      } else {
        alert("Erro ao excluir o agendamento. Por favor, tente novamente.");
      }
    } catch (error) {
      console.error("Erro ao processar cancelamento:", error);
      alert("Ocorreu um erro ao processar o cancelamento.");
    }
  };

  // --- Services Logic ---
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService?.id) {
      updateService(editingService.id, editingService);
    } else {
      addService(editingService as Omit<Service, 'id'>);
    }
    setIsServiceModalOpen(false);
    setEditingService(null);
  };

  // --- Barbers Logic ---
  const [editingBarber, setEditingBarber] = useState<Partial<Barber> | null>(null);
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);

  const handleSaveBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBarber?.id) {
      updateBarber(editingBarber.id, editingBarber);
    } else {
      addBarber(editingBarber as Omit<Barber, 'id'>);
    }
    setIsBarberModalOpen(false);
    setEditingBarber(null);
  };

  const handleExportMonthlyReport = async (month: string) => {
    try {
      const response = await fetch(`/api/reports/export/${month}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-imperial-${month}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao exportar relatório.");
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      alert("Erro de rede ao exportar relatório.");
    }
  };

  const [monthlyStats, setMonthlyStats] = useState<{ month: string, totalCuts: number, totalRevenue: number }[]>([]);

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      try {
        const response = await fetch('/api/stats/monthly', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          setMonthlyStats(await response.json());
        }
      } catch (error) {
        console.error("Error fetching monthly stats:", error);
      }
    };

    if (activeTab === 'dashboard' || activeTab === 'reports') {
      fetchMonthlyStats();
    }
  }, [activeTab, appointments, token]);

  const menuItems = useMemo(() => {
    const items = [
      { id: 'appointments', label: 'Agenda', icon: CalendarIcon },
      { id: 'history', label: 'Histórico', icon: History },
    ];
    
    if (user?.role === 'owner') {
      items.unshift({ id: 'dashboard', label: 'Visão Geral', icon: BarChart2 });
      items.push({ id: 'reports', label: 'Relatórios', icon: TrendingUp });
      items.push({ id: 'barbers', label: 'Barbeiros', icon: Users });
      items.push({ id: 'services', label: 'Serviços', icon: Scissors });
    }
    
    return items;
  }, [user]);

  // Set default tab based on role
  useEffect(() => {
    if (user?.role === 'barber') {
      setActiveTab('appointments');
    }
  }, [user]);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white flex flex-col font-sans">
      {/* Mobile Header */}
      <header className="bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors lg:hidden text-gray-400"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-navy-900 font-bold">I</div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">Imperial<span className="text-gold-500">Barbearia</span></h1>
              <span className="text-[8px] text-gold-500/50 font-black uppercase tracking-widest">v1.2 - Agendamentos</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canInstall && !isStandalone && (
            <motion.button 
              whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleInstall}
              className="bg-gold-500 text-navy-900 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)]"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Instalar App</span>
            </motion.button>
          )}
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 transition-all text-xs font-medium flex items-center gap-2"
          >
            <LogOut size={14} className="rotate-180" />
            <span className="hidden sm:inline">Ver Site</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { logout(); navigate('/'); }}
            className="text-gray-400 hover:text-white p-2 transition-colors rounded-lg"
            title="Sair"
          >
            <LogOut size={20} />
          </motion.button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <AnimatePresence>
          {(isMenuOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className={`
                fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#1e293b] border-r border-white/5 flex flex-col
                ${isMenuOpen ? 'block shadow-2xl' : 'hidden lg:flex'}
              `}
            >
              <nav className="flex-1 p-4 space-y-2 mt-4">
                {menuItems.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${activeTab === item.id ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </motion.button>
                ))}
              </nav>
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 text-gold-500 flex items-center justify-center text-xs font-bold border border-gold-500/20">
                    {user?.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{user?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role === 'owner' ? 'Proprietário' : 'Barbeiro'}</p>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-[#0f172a] p-4 lg:p-8 w-full">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && user?.role === 'owner' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white">Dashboard Financeiro</h2>
                  <p className="text-gray-400 text-sm">Visão geral do desempenho da barbearia</p>
                </div>
                <button onClick={exportCSV} className="bg-[#1e293b] hover:bg-[#334155] text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-white/10 transition-colors w-full sm:w-auto justify-center shadow-lg">
                  <Download size={16} /> Exportar Relatório
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={48} />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Receita ({dashboardMetrics.periodLabel})</p>
                  <h3 className="text-2xl font-bold text-white">R$ {dashboardMetrics.totalRevenue.toFixed(2)}</h3>
                  <div className="mt-4 flex items-center text-xs text-green-400 gap-1">
                    <TrendingUp size={12} />
                    <span>+12% vs mês anterior</span>
                  </div>
                </div>

                <div className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={48} />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Agendamentos ({dashboardMetrics.periodLabel})</p>
                  <h3 className="text-2xl font-bold text-white">{dashboardMetrics.totalAppointments}</h3>
                  <div className="mt-4 flex items-center text-xs text-blue-400 gap-1">
                    <UserCheck size={12} />
                    <span>{dashboardMetrics.todayCount} hoje</span>
                  </div>
                </div>

                <div className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BarChart2 size={48} />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Ticket Médio ({dashboardMetrics.periodLabel})</p>
                  <h3 className="text-2xl font-bold text-white">R$ {dashboardMetrics.averageTicket.toFixed(2)}</h3>
                  <div className="mt-4 flex items-center text-xs text-gray-400 gap-1">
                    <span>Por cliente</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gold-500 to-gold-600 p-6 rounded-2xl shadow-xl relative overflow-hidden text-navy-900">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <UserCheck size={48} />
                  </div>
                  <p className="text-navy-900/70 text-sm font-bold mb-1">Atendidos ({dashboardMetrics.periodLabel})</p>
                  <h3 className="text-2xl font-bold">{dashboardMetrics.periodAttended}</h3>
                  <div className="mt-4 flex items-center text-xs font-bold gap-1 bg-white/20 w-fit px-2 py-1 rounded-full">
                    <span>{dashboardMetrics.todayCount} hoje</span>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Desempenho Financeiro</h3>
                    <div className="flex bg-[#0f172a] rounded-lg p-1 border border-white/5">
                      {['day', 'week', 'month'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setChartPeriod(p as any)}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${chartPeriod === p ? 'bg-gold-500 text-navy-900' : 'text-gray-400 hover:text-white'}`}
                        >
                          {p === 'day' ? 'Dia' : p === 'week' ? 'Sem' : 'Mês'}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorLeomar" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPedro" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        {barbers.map((barber, index) => {
                          const colors = ['#fbbf24', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];
                          const color = colors[index % colors.length];
                          return (
                            <React.Fragment key={barber.id}>
                              <defs>
                                <linearGradient id={`color${barber.id}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <Area 
                                type="monotone" 
                                dataKey={barber.name.toLowerCase()} 
                                name={barber.name} 
                                stroke={color} 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill={`url(#color${barber.id})`} 
                              />
                            </React.Fragment>
                          );
                        })}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart */}
                <div className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-6">Distribuição</h3>
                  <div className="flex-1 min-h-[200px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-lg font-bold text-white">R$ {dashboardMetrics.totalRevenue.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-gray-300">{entry.name}</span>
                        </div>
                        <span className="font-bold text-white">R$ {entry.value.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Agenda de Atendimentos</h2>
                  <p className="text-gray-400 text-sm">Gerencie os horários marcados</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  {/* Barber Filter */}
                  {user?.role === 'owner' && (
                    <div className="relative flex-1 md:flex-none">
                      <select
                        value={selectedBarberFilter}
                        onChange={(e) => setSelectedBarberFilter(e.target.value)}
                        className="w-full bg-[#1e293b] text-white pl-10 pr-4 py-2 rounded-xl border border-white/10 outline-none focus:border-gold-500 transition-all appearance-none text-sm font-medium"
                      >
                        <option value="all">Todos os Barbeiros</option>
                        {barbers.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                  )}

                  {/* View Toggle */}
                  <div className="flex bg-[#1e293b] p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setViewMode('calendar')}
                      className={cn(
                        "p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium",
                        viewMode === 'calendar' ? "bg-gold-500 text-navy-900" : "text-gray-400 hover:text-white"
                      )}
                    >
                      <CalendarIcon size={18} />
                      <span className="hidden sm:inline">Calendário</span>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium",
                        viewMode === 'list' ? "bg-gold-500 text-navy-900" : "text-gray-400 hover:text-white"
                      )}
                    >
                      <List size={18} />
                      <span className="hidden sm:inline">Lista</span>
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'calendar' ? (
                <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
                  {/* Calendar Header */}
                  <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#1e293b]/30">
                    <h3 className="text-xl font-bold text-white capitalize">
                      {format(currentCalendarDate, 'MMMM yyyy', { locale: ptBR })}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentCalendarDate(subMonths(currentCalendarDate, 1))}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        onClick={() => setCurrentCalendarDate(new Date())}
                        className="px-4 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-gold-500 transition-colors border border-gold-500/20"
                      >
                        Hoje
                      </button>
                      <button 
                        onClick={() => setCurrentCalendarDate(addMonths(currentCalendarDate, 1))}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 border-b border-white/5">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 bg-[#0f172a]/30">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {calendarDays.map((day, i) => {
                      const dayKey = format(day, 'yyyy-MM-dd');
                      const dayAppointments = appointmentsByDay[dayKey] || [];
                      const isCurrentMonth = isSameMonth(day, currentCalendarDate);
                      const isTodayDate = isToday(day);

                      return (
                        <div 
                          key={day.toString()} 
                          className={cn(
                            "min-h-[120px] p-2 border-r border-b border-white/5 transition-colors relative group",
                            !isCurrentMonth ? "bg-[#0f172a]/20 opacity-30" : "hover:bg-white/[0.02]",
                            i % 7 === 6 && "border-r-0"
                          )}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={cn(
                              "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all",
                              isTodayDate ? "bg-gold-500 text-navy-900 shadow-lg shadow-gold-500/20" : "text-gray-400 group-hover:text-white"
                            )}>
                              {format(day, 'd')}
                            </span>
                            {dayAppointments.length > 0 && (
                              <span className="text-[10px] font-black bg-gold-500/10 text-gold-500 px-1.5 py-0.5 rounded border border-gold-500/20">
                                {dayAppointments.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                            {dayAppointments.slice(0, 3).map(app => (
                              <div 
                                key={app.id}
                                onClick={() => toggleAttended(app.id)}
                                className={cn(
                                  "text-[10px] p-1.5 rounded-lg border transition-all cursor-pointer truncate group/item relative",
                                  app.attended 
                                    ? "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20" 
                                    : "bg-[#0f172a] border-white/5 hover:border-gold-500/30"
                                )}
                                title={`${app.clientName} - ${getServiceName(app.serviceId)}${app.attended ? ' (Atendido)' : ''}`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full shrink-0",
                                      app.attended ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" : "bg-gold-500"
                                    )}></div>
                                    <span className={cn(
                                      "font-bold truncate",
                                      app.attended ? "text-emerald-400" : "text-white"
                                    )}>{format(parseISO(app.date), 'HH:mm')}</span>
                                    <span className={cn(
                                      "truncate",
                                      app.attended ? "text-emerald-500/70" : "text-gray-400"
                                    )}>{app.clientName.split(' ')[0]}</span>
                                  </div>
                                  <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                    {app.attended && <UserCheck size={10} className="text-emerald-500" />}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancel(e, app);
                                      }}
                                      className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-all shrink-0"
                                      title="Cancelar Agendamento"
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {dayAppointments.length > 3 && (
                              <div className="text-[9px] text-center text-gray-500 font-bold py-1">
                                + {dayAppointments.length - 3} mais
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Date Navigation for List View */}
                  <div className="bg-[#1e293b] p-5 rounded-2xl border border-gold-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => {
                          const newDate = new Date(selectedListDate);
                          newDate.setDate(newDate.getDate() - 1);
                          setSelectedListDate(newDate);
                        }}
                        className="p-3 hover:bg-gold-500/10 rounded-xl text-gold-500 transition-all border border-gold-500/10 hover:border-gold-500/30"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div className="text-center min-w-[180px]">
                        <h4 className="text-xl font-black text-white capitalize leading-tight">
                          {isToday(selectedListDate) ? 'Hoje, ' : ''}
                          {format(selectedListDate, "dd 'de' MMMM", { locale: ptBR })}
                        </h4>
                        <p className="text-xs text-gold-500 font-black uppercase tracking-[0.2em] mt-1">
                          {format(selectedListDate, "EEEE", { locale: ptBR })}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const newDate = new Date(selectedListDate);
                          newDate.setDate(newDate.getDate() + 1);
                          setSelectedListDate(newDate);
                        }}
                        className="p-3 hover:bg-gold-500/10 rounded-xl text-gold-500 transition-all border border-gold-500/10 hover:border-gold-500/30"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500" size={16} />
                        <input 
                          type="date" 
                          value={format(selectedListDate, 'yyyy-MM-dd')}
                          onChange={(e) => {
                            const [year, month, day] = e.target.value.split('-').map(Number);
                            setSelectedListDate(new Date(year, month - 1, day));
                          }}
                          className="bg-[#0f172a] text-white pl-10 pr-4 py-2.5 rounded-xl border border-white/10 outline-none focus:border-gold-500 text-sm font-bold w-full transition-all"
                        />
                      </div>
                      {!isToday(selectedListDate) && (
                        <button 
                          onClick={() => setSelectedListDate(new Date())}
                          className="px-6 py-2.5 bg-gold-500 text-navy-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gold-400 transition-all shadow-lg shadow-gold-500/20"
                        >
                          Hoje
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                    <div className="divide-y divide-white/5">
                      {filteredAppointmentsList.length > 0 ? (
                        filteredAppointmentsList.map((app) => (
                          <div key={app.id} className={cn(
                            "p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors group relative overflow-hidden",
                            app.attended && "bg-emerald-500/[0.02]"
                          )}>
                            {app.attended && (
                              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                            )}
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center font-bold border shadow-inner transition-all",
                                app.attended 
                                  ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" 
                                  : "bg-[#0f172a] text-gold-500 border-white/10"
                              )}>
                                {app.attended ? <UserCheck size={24} /> : app.clientName.charAt(0)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className={cn(
                                    "font-bold text-lg transition-colors",
                                    app.attended ? "text-emerald-400" : "text-white"
                                  )}>{app.clientName}</h3>
                                  {app.attended && (
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-black px-2 py-0.5 rounded border border-emerald-500/20 tracking-widest">Atendido</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                  <span className="bg-white/5 px-2 py-0.5 rounded text-xs border border-white/5">{getServiceName(app.serviceId)}</span>
                                  <span>•</span>
                                  <span className="text-gold-500">{getBarberName(app.barberId)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                  <Clock size={12} />
                                  <span className="font-bold text-gray-300">{format(parseISO(app.date), 'HH:mm')}</span>
                                  <span className="ml-2 text-gold-500/80 font-medium">{formatCurrency(app.price)}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => toggleAttended(app.id)}
                                className={cn(
                                  "flex-1 sm:flex-none p-4 rounded-xl transition-all flex items-center justify-center gap-2 border shadow-lg",
                                  app.attended 
                                    ? "bg-emerald-500 text-white border-emerald-400" 
                                    : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white"
                                )}
                                title={app.attended ? "Marcar como não atendido" : "Marcar como atendido"}
                              >
                                <UserCheck size={20} />
                                <span className="sm:hidden font-bold">{app.attended ? 'Atendido' : 'Marcar Atendido'}</span>
                              </button>
                              
                              <button 
                                onClick={(e) => handleCancel(e, app)}
                                className="flex-1 sm:flex-none bg-red-500/10 text-red-400 p-4 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-red-500/20 border border-transparent hover:border-red-400/50 cursor-pointer"
                                title="Cancelar Agendamento"
                              >
                                <Trash2 size={20} />
                                <span className="sm:hidden font-bold">Cancelar</span>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                          <CalendarIcon size={48} className="mb-4 opacity-20" />
                          <p className="text-lg">Nenhum agendamento para este dia.</p>
                          <p className="text-sm opacity-60">Novos agendamentos aparecerão aqui.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Histórico de Agendamentos</h2>
                  <p className="text-gray-400 text-sm">Consulte atendimentos passados por mês</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-3 bg-[#1e293b] p-1 rounded-xl border border-white/5">
                    <select 
                      value={selectedHistoryMonth}
                      onChange={(e) => setSelectedHistoryMonth(e.target.value)}
                      className="bg-transparent text-white px-4 py-2 outline-none cursor-pointer font-medium text-sm"
                    >
                      {availableMonths.map(month => {
                        const [year, m] = month.split('-');
                        const date = new Date(Number(year), Number(m) - 1);
                        const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                        return <option key={month} value={month} className="bg-[#1e293b]">{label.charAt(0).toUpperCase() + label.slice(1)}</option>;
                      })}
                    </select>
                  </div>
                  {user?.role === 'owner' && (
                    <button 
                      onClick={handleDeleteMonth}
                      className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-white/5 hover:border-red-400/50"
                      title="Excluir todos os registros deste mês"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <div className="divide-y divide-white/5">
                  {historyAppointments.length > 0 ? (
                    historyAppointments.map((app) => (
                      <div key={app.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold border border-white/10 shadow-inner ${app.status === 'cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-[#0f172a] text-gold-500'}`}>
                            {app.clientName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-white text-lg">{app.clientName}</h3>
                              {app.status === 'cancelled' && (
                                <span className="bg-red-500/10 text-red-500 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-red-500/20">Cancelado</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                              <span className="bg-white/5 px-2 py-0.5 rounded text-xs border border-white/5">{getServiceName(app.serviceId)}</span>
                              <span>•</span>
                              <span className="text-gold-500">{getBarberName(app.barberId)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                              <CalendarIcon size={12} />
                              {format(parseISO(app.date), 'dd/MM/yyyy')}
                              <Clock size={12} className="ml-2" />
                              {format(parseISO(app.date), 'HH:mm')}
                              <span className="ml-2 text-gold-500/80 font-medium">{formatCurrency(app.price)}</span>
                            </div>
                          </div>
                        </div>
                        {user?.role === 'owner' && (
                          <button 
                            onClick={(e) => handleCancel(e, app)}
                            className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-white/5 hover:border-red-400/50"
                            title="Cancelar e Excluir registro"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
                      <History size={48} className="mb-4 opacity-20" />
                      <p className="text-lg">Nenhum registro para este mês.</p>
                      <p className="text-sm opacity-60">Selecione outro período acima.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && user?.role === 'owner' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div>
                <h2 className="text-2xl font-bold text-white">Relatórios Mensais</h2>
                <p className="text-gray-400 text-sm">Acompanhamento de faturamento e produtividade por mês</p>
              </div>

              <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0f172a] border-b border-white/5">
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500">Mês/Ano</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500">Qtd. Cortes</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500">Faturamento</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500">Ticket Médio</th>
                      <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {monthlyStats.map((stat) => {
                      const [year, month] = stat.month.split('-');
                      const date = new Date(Number(year), Number(month) - 1);
                      const monthName = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                      
                      return (
                        <tr key={stat.month} className="hover:bg-white/5 transition-colors">
                          <td className="p-4 font-bold text-white capitalize">{monthName}</td>
                          <td className="p-4 text-gray-300">{stat.totalCuts} cortes</td>
                          <td className="p-4 text-gold-500 font-bold">{formatCurrency(stat.totalRevenue)}</td>
                          <td className="p-4 text-gray-400">{formatCurrency(stat.totalRevenue / stat.totalCuts)}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleExportMonthlyReport(stat.month)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold-500/10 text-gold-500 hover:bg-gold-500 hover:text-navy-900 rounded-lg text-xs font-bold transition-all border border-gold-500/20"
                              title="Exportar Planilha Completa"
                            >
                              <Download size={14} />
                              <span className="hidden sm:inline">Exportar CSV</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {monthlyStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-12 text-center text-gray-500">
                          Nenhum dado disponível para gerar relatórios.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pieData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Faturamento por Barbeiro</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => formatCurrency(value)}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 shadow-xl">
                    <h3 className="text-lg font-bold text-white mb-6">Legenda</h3>
                    <div className="space-y-4">
                      {pieData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-gray-300">{item.name}</span>
                          </div>
                          <span className="font-bold text-white">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* BARBERS TAB */}
          {activeTab === 'barbers' && user?.role === 'owner' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Gerenciar Barbeiros</h2>
                <button 
                  onClick={() => { setEditingBarber({}); setIsBarberModalOpen(true); }}
                  className="bg-gold-500 text-navy-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                >
                  <Plus size={20} /> Novo Barbeiro
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {barbers.map((barber) => (
                  <div key={barber.id} className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-gold-500/30 transition-all group shadow-lg hover:shadow-xl hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gold-500/30">
                        <img src={barber.image} alt={barber.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex gap-2 transition-opacity">
                        <button 
                          onClick={() => { setEditingBarber(barber); setIsBarberModalOpen(true); }}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => { if(window.confirm('Excluir barbeiro?')) deleteBarber(barber.id); }}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-white text-lg mb-1">{barber.name}</h3>
                    <p className="text-gray-400 text-sm flex items-center gap-2 mt-2">
                      <Bell size={14} className="text-gold-500" /> {barber.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && user?.role === 'owner' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Gerenciar Serviços</h2>
                <button 
                  onClick={() => { setEditingService({}); setIsServiceModalOpen(true); }}
                  className="bg-gold-500 text-navy-900 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                >
                  <Plus size={20} /> Novo Serviço
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <div key={service.id} className="bg-[#1e293b]/50 backdrop-blur-sm p-6 rounded-2xl border border-white/5 hover:border-gold-500/30 transition-all group shadow-lg hover:shadow-xl hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#0f172a] flex items-center justify-center text-gold-500 border border-white/10">
                        <Scissors size={20} />
                      </div>
                      <div className="flex gap-2 transition-opacity">
                        <button 
                          onClick={() => { setEditingService(service); setIsServiceModalOpen(true); }}
                          className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => { if(window.confirm('Excluir serviço?')) deleteService(service.id); }}
                          className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-white text-lg mb-1">{service.name}</h3>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                      <span className="text-gray-400 text-sm flex items-center gap-1">
                        <Clock size={14} /> {service.duration} min
                      </span>
                      <span className="text-gold-500 font-bold text-lg">R$ {service.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barber Modal */}
          {isBarberModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1e293b] w-full max-w-md rounded-2xl p-8 border border-white/10 shadow-2xl relative"
              >
                <button 
                  onClick={() => setIsBarberModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
                
                <h3 className="text-2xl font-bold text-white mb-6">
                  {editingBarber?.id ? 'Editar Barbeiro' : 'Novo Barbeiro'}
                </h3>
                
                <form onSubmit={handleSaveBarber} className="space-y-5">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2 font-medium">Nome do Barbeiro</label>
                    <input 
                      type="text" 
                      value={editingBarber?.name || ''} 
                      onChange={e => setEditingBarber({...editingBarber, name: e.target.value})}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                      placeholder="Ex: João Silva"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2 font-medium">WhatsApp (com DDD)</label>
                    <input 
                      type="text" 
                      value={editingBarber?.phone || ''} 
                      onChange={e => setEditingBarber({...editingBarber, phone: e.target.value})}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                      placeholder="Ex: 5581999999999"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2 font-medium">URL da Foto</label>
                    <input 
                      type="text" 
                      value={editingBarber?.image || ''} 
                      onChange={e => setEditingBarber({...editingBarber, image: e.target.value})}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button 
                      type="button"
                      onClick={() => setIsBarberModalOpen(false)}
                      className="flex-1 bg-[#0f172a] text-white py-3 rounded-xl font-bold hover:bg-[#334155] transition-colors border border-white/10"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-gold-500 text-navy-900 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#1e293b] w-full max-w-md rounded-2xl p-8 border border-white/10 shadow-2xl relative"
              >
                <button 
                  onClick={() => setIsServiceModalOpen(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                  <X size={24} />
                </button>
                
                <h3 className="text-2xl font-bold text-white mb-6">
                  {editingService?.id ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                
                <form onSubmit={handleSaveService} className="space-y-5">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2 font-medium">Nome do Serviço</label>
                    <input 
                      type="text" 
                      value={editingService?.name || ''} 
                      onChange={e => setEditingService({...editingService, name: e.target.value})}
                      className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                      placeholder="Ex: Corte Degradê"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 block mb-2 font-medium">Preço (R$)</label>
                      <input 
                        type="number" 
                        value={editingService?.price || ''} 
                        onChange={e => setEditingService({...editingService, price: Number(e.target.value)})}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 block mb-2 font-medium">Duração (min)</label>
                      <input 
                        type="number" 
                        value={editingService?.duration || ''} 
                        onChange={e => setEditingService({...editingService, duration: Number(e.target.value)})}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-white focus:border-gold-500 outline-none transition-colors"
                        placeholder="30"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-8">
                    <button 
                      type="button"
                      onClick={() => setIsServiceModalOpen(false)}
                      className="flex-1 bg-[#0f172a] text-white py-3 rounded-xl font-bold hover:bg-[#334155] transition-colors border border-white/10"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-gold-500 text-navy-900 py-3 rounded-xl font-bold hover:bg-gold-400 transition-colors shadow-lg shadow-gold-500/20"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
