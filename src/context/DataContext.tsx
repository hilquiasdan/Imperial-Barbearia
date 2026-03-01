import React, { createContext, useContext, useState, useEffect } from 'react';
import { SERVICES_DATA as INITIAL_SERVICES, BARBERS as INITIAL_BARBERS } from '../utils';
import { useAuth } from './AuthContext';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  image: string;
  description?: string;
}

export interface Barber {
  id: string;
  name: string;
  image: string;
  phone: string;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  barberId: string;
  date: string; // ISO string
  status: 'confirmed' | 'cancelled';
  price: number;
}

interface DataContextType {
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  loading: boolean;
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addBarber: (barber: Omit<Barber, 'id'>) => Promise<void>;
  updateBarber: (id: string, barber: Partial<Barber>) => Promise<void>;
  deleteBarber: (id: string) => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => Promise<void>;
  cancelAppointment: (id: string) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  deleteAppointmentsByMonth: (month: string) => Promise<boolean>;
  getBarberName: (id: string) => string;
  getServiceName: (id: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);


export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES);
  const [barbers, setBarbers] = useState<Barber[]>(INITIAL_BARBERS);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [servicesRes, barbersRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/barbers')
        ]);

        if (servicesRes.ok) setServices(await servicesRes.json());
        if (barbersRes.ok) setBarbers(await barbersRes.json());

        // Only fetch appointments if authenticated
        if (isAuthenticated && token) {
          const appointmentsRes = await fetch('/api/appointments', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (appointmentsRes.ok) setAppointments(await appointmentsRes.json());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, isAuthenticated]);

  const addService = async (service: Omit<Service, 'id'>) => {
    const newService = { ...service, id: Date.now().toString() };
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newService)
      });
      if (response.ok) {
        setServices(prev => [...prev, newService]);
      }
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  const updateService = async (id: string, updatedService: Partial<Service>) => {
    const currentService = services.find(s => s.id === id);
    if (!currentService) return;
    const merged = { ...currentService, ...updatedService };
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(merged)
      });
      if (response.ok) {
        setServices(prev => prev.map(s => s.id === id ? merged : s));
      }
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const deleteService = async (id: string) => {
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setServices(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const addBarber = async (barber: Omit<Barber, 'id'>) => {
    const newBarber = { ...barber, id: Date.now().toString() };
    try {
      const response = await fetch('/api/barbers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newBarber)
      });
      if (response.ok) {
        setBarbers(prev => [...prev, newBarber]);
      }
    } catch (error) {
      console.error("Error adding barber:", error);
    }
  };

  const updateBarber = async (id: string, updatedBarber: Partial<Barber>) => {
    const currentBarber = barbers.find(b => b.id === id);
    if (!currentBarber) return;
    const merged = { ...currentBarber, ...updatedBarber };
    try {
      const response = await fetch(`/api/barbers/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(merged)
      });
      if (response.ok) {
        setBarbers(prev => prev.map(b => b.id === id ? merged : b));
      }
    } catch (error) {
      console.error("Error updating barber:", error);
    }
  };

  const deleteBarber = async (id: string) => {
    try {
      const response = await fetch(`/api/barbers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setBarbers(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error("Error deleting barber:", error);
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
      status: 'confirmed'
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppointment)
      });

      if (response.ok) {
        setAppointments(prev => [newAppointment, ...prev]);
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
    }
  };

  const cancelAppointment = async (id: string) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'cancelled' })
      });

      if (response.ok) {
        setAppointments(prev => prev.map(a => 
          a.id === id ? { ...a, status: 'cancelled' } : a
        ));
        return true;
      } else {
        const errorData = await response.json();
        console.error("Server error cancelling appointment:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Network error cancelling appointment:", error);
      return false;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting appointment:", error);
      return false;
    }
  };

  const deleteAppointmentsByMonth = async (month: string) => {
    try {
      const response = await fetch(`/api/appointments/month/${month}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAppointments(prev => prev.filter(a => 
          !new Date(a.date).toISOString().startsWith(month)
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting appointments by month:", error);
      return false;
    }
  };

  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'Desconhecido';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Desconhecido';

  return (
    <DataContext.Provider value={{
      services,
      barbers,
      appointments,
      loading,
      addService,
      updateService,
      deleteService,
      addBarber,
      updateBarber,
      deleteBarber,
      addAppointment,
      cancelAppointment,
      deleteAppointment,
      deleteAppointmentsByMonth,
      getBarberName,
      getServiceName
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
