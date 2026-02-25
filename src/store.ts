import { useState, useEffect } from 'react';
import { SERVICES_DATA } from './utils';

// Types
export interface Appointment {
  id: string;
  barberId: string;
  serviceId: string;
  date: string; // ISO string
  customerName: string;
  customerPhone: string;
  status: 'scheduled' | 'cancelled' | 'completed';
  price: number;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  image: string;
}

// Mock Store
const STORAGE_KEY_APPOINTMENTS = 'imperial_appointments';
const STORAGE_KEY_SERVICES = 'imperial_services';

export const useStore = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>(SERVICES_DATA);

  useEffect(() => {
    const storedAppts = localStorage.getItem(STORAGE_KEY_APPOINTMENTS);
    if (storedAppts) {
      setAppointments(JSON.parse(storedAppts));
    }

    // Forcing update of services to ensure new images are loaded
    setServices(SERVICES_DATA);
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(SERVICES_DATA));
    
    /* 
    // Previous logic that was causing the issue (keeping old images)
    const storedServices = localStorage.getItem(STORAGE_KEY_SERVICES);
    if (storedServices) {
      setServices(JSON.parse(storedServices));
    }
    */
  }, []);

  const addAppointment = (appt: Omit<Appointment, 'id' | 'status'>) => {
    const newAppt: Appointment = {
      ...appt,
      id: Math.random().toString(36).substr(2, 9),
      status: 'scheduled',
    };
    const updated = [...appointments, newAppt];
    setAppointments(updated);
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(updated));
    return newAppt;
  };

  const cancelAppointment = (id: string) => {
    const updated = appointments.map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a);
    setAppointments(updated);
    localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(updated));
  };

  const updateService = (service: Service) => {
    const updated = services.map(s => s.id === service.id ? service : s);
    setServices(updated);
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  };

  const addService = (service: Omit<Service, 'id'>) => {
    const newService = { ...service, id: Math.random().toString(36).substr(2, 9) };
    const updated = [...services, newService];
    setServices(updated);
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  };

  const removeService = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(updated));
  };

  return {
    appointments,
    services,
    addAppointment,
    cancelAppointment,
    updateService,
    addService,
    removeService
  };
};
