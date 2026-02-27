import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LEOMAR_IMAGE, PEDRO_IMAGE } from './assets/barberImages';

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
  { id: '1', name: 'Corte Degradê Social ou Moicano', price: 50, duration: 45, image: 'https://i.postimg.cc/90zRYMhq/Corte-Degrade-Social-Ou-Moicano.webp' },
  { id: '2', name: 'Barba', price: 30, duration: 30, image: 'https://i.postimg.cc/vmHVZXN7/Barba.jpg' },
  { id: '3', name: 'Corte + Barba', price: 80, duration: 75, image: 'https://i.postimg.cc/Hn5JhNrG/Corte-Barba.jpg' },
  { id: '4', name: 'Cabelo + Barba + Sobrancelha', price: 95, duration: 90, image: 'https://i.postimg.cc/J0Jy2FGv/Cabelo-Barba-Sobrancelha.jpg' },
  { id: '5', name: 'Barba Pigmentada', price: 40, duration: 40, image: 'https://i.postimg.cc/RVKfsWtL/Barba-Pigmentada.jpg' },
  { id: '6', name: 'Pezinho', price: 15, duration: 15, image: 'https://i.postimg.cc/grFzLkcq/Pezinho.jpg' },
  { id: '7', name: 'Corte Infantil', price: 45, duration: 40, image: 'https://i.postimg.cc/GtYB5fHS/Corte-Infantil.jpg' },
  { id: '8', name: 'Corte na Tesoura', price: 60, duration: 50, image: 'https://i.postimg.cc/wMJtGr7P/Corte-na-Tesoura.jpg' },
  { id: '9', name: 'Corte Pente Único', price: 40, duration: 30, image: 'https://i.postimg.cc/4ytKS0mr/Corte-Pente-Unico.jpg' },
  { id: '10', name: 'Corte + Pigmentação', price: 75, duration: 60, image: 'https://i.postimg.cc/PJZLR7P7/Corte-Pigmentacao.jpg' },
  { id: '11', name: 'Hidratação + Finalização', price: 40, duration: 30, image: 'https://i.postimg.cc/fyX3rPVh/Hidratacao-Finalizacao.jpg' },
  { id: '12', name: 'Limpeza de Pele', price: 35, duration: 30, image: 'https://i.postimg.cc/1X6gjd81/Limpeza-de-Pele.jpg' },
  { id: '13', name: 'Limpeza Nasal', price: 15, duration: 15, image: 'https://i.postimg.cc/d04VNYnC/Limpeza-Nasal.webp' },
  { id: '14', name: 'Luzes + Corte', price: 120, duration: 120, image: 'https://i.postimg.cc/0jm6B4zs/Luzes-Corte.jpg' },
  { id: '15', name: 'Platinado + Corte', price: 150, duration: 150, image: 'https://i.postimg.cc/NFTyznKY/Platinado-Corte.jpg' },
  { id: '16', name: 'Selagem + Corte', price: 110, duration: 90, image: 'https://i.postimg.cc/gjRwT7xm/Selagem-Corte.jpg' }
];

export const BARBERS = [
  { id: '1', name: 'Leomar', image: LEOMAR_IMAGE, phone: '558184361210' },
  { id: '2', name: 'Pedro', image: PEDRO_IMAGE, phone: '558173176920' },
];

export const REVIEWS = [
  { id: 1, name: "Carlos Silva", rating: 5, text: "Melhor barbearia da cidade! Atendimento impecável." },
  { id: 2, name: "André Souza", rating: 5, text: "O corte ficou perfeito. O ambiente é muito luxuoso." },
  { id: 3, name: "Felipe Santos", rating: 4, text: "Profissionais excelentes e cerveja gelada!" },
  { id: 4, name: "Ricardo Oliveira", rating: 5, text: "A barba com toalha quente é uma experiência única." },
];
