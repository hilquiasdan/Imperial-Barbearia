import React, { createContext, useContext, useState, useEffect } from 'react';
import { SERVICES_DATA as INITIAL_SERVICES, BARBERS as INITIAL_BARBERS } from '../utils';

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  image: string;
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
  addService: (service: Omit<Service, 'id'>) => void;
  updateService: (id: string, service: Partial<Service>) => void;
  deleteService: (id: string) => void;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  cancelAppointment: (id: string) => void;
  getBarberName: (id: string) => string;
  getServiceName: (id: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);


export function DataProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<Service[]>(() => {
    const stored = localStorage.getItem('services');
    return stored ? JSON.parse(stored) : INITIAL_SERVICES;
  });

  const [barbers] = useState<Barber[]>(INITIAL_BARBERS);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const stored = localStorage.getItem('imperial_appointments_v2');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('imperial_appointments_v2', JSON.stringify(appointments));
  }, [appointments]);

  const addService = (service: Omit<Service, 'id'>) => {
    const newService = { ...service, id: Date.now().toString() };
    setServices([...services, newService]);
  };

  const updateService = (id: string, updatedService: Partial<Service>) => {
    setServices(services.map(s => s.id === id ? { ...s, ...updatedService } : s));
  };

  const deleteService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const addAppointment = (appointment: Omit<Appointment, 'id' | 'status'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: Date.now().toString(),
      status: 'confirmed'
    };
    setAppointments([newAppointment, ...appointments]);
  };

  const cancelAppointment = (id: string) => {
    setAppointments(appointments.map(a => 
      a.id === id ? { ...a, status: 'cancelled' } : a
    ));
  };

  const getBarberName = (id: string) => barbers.find(b => b.id === id)?.name || 'Desconhecido';
  const getServiceName = (id: string) => services.find(s => s.id === id)?.name || 'Desconhecido';

  return (
    <DataContext.Provider value={{
      services,
      barbers,
      appointments,
      addService,
      updateService,
      deleteService,
      addAppointment,
      cancelAppointment,
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
