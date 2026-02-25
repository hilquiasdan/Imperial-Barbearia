import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const SERVICES_DATA = [
  { id: '1', name: 'Corte Masculino', price: 50, duration: 45, image: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=800&auto=format&fit=crop' },
  { id: '2', name: 'Barba Tradicional', price: 35, duration: 30, image: 'https://images.unsplash.com/photo-1503951914875-befbb6470523?q=80&w=800&auto=format&fit=crop' },
  { id: '3', name: 'Corte + Barba', price: 80, duration: 75, image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop' },
  { id: '4', name: 'Barba Premium (Toalha Quente)', price: 45, duration: 40, image: 'https://images.unsplash.com/photo-1532710093739-947053e41482?q=80&w=800&auto=format&fit=crop' },
  { id: '5', name: 'Pigmentação de Barba', price: 30, duration: 30, image: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800&auto=format&fit=crop' },
  { id: '6', name: 'Sobrancelha Masculina', price: 20, duration: 15, image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop' },
  { id: '7', name: 'Corte Infantil', price: 45, duration: 40, image: 'https://images.unsplash.com/photo-1599351431613-18ef1fdd27e1?q=80&w=800&auto=format&fit=crop' },
  { id: '8', name: 'Design de Barba', price: 25, duration: 20, image: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?q=80&w=800&auto=format&fit=crop' },
  { id: '9', name: 'Hidratação Capilar', price: 40, duration: 30, image: 'https://images.unsplash.com/photo-1560365163-3e8d64a762ef?q=80&w=800&auto=format&fit=crop' },
  { id: '10', name: 'Luzes Masculinas', price: 90, duration: 90, image: 'https://images.unsplash.com/photo-1597005954639-95a1d1b89a81?q=80&w=800&auto=format&fit=crop' },
  { id: '11', name: 'Alisamento Masculino', price: 80, duration: 60, image: 'https://images.unsplash.com/photo-1623826580603-66d924824e4a?q=80&w=800&auto=format&fit=crop' },
  { id: '12', name: 'Massagem Capilar', price: 30, duration: 20, image: 'https://images.unsplash.com/photo-1616394584738-65b431c4290a?q=80&w=800&auto=format&fit=crop' }
];

import { LEOMAR_IMAGE, PEDRO_IMAGE } from './assets/barberImages';

export const BARBERS = [
  { id: '1', name: 'Leomar', image: LEOMAR_IMAGE },
  { id: '2', name: 'Pedro', image: PEDRO_IMAGE },
];

export const REVIEWS = [
  { id: 1, name: "Carlos Silva", rating: 5, text: "Melhor barbearia da cidade! Atendimento impecável." },
  { id: 2, name: "André Souza", rating: 5, text: "O corte ficou perfeito. O ambiente é muito luxuoso." },
  { id: 3, name: "Felipe Santos", rating: 4, text: "Profissionais excelentes e cerveja gelada!" },
  { id: 4, name: "Ricardo Oliveira", rating: 5, text: "A barba com toalha quente é uma experiência única." },
];
