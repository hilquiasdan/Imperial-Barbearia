import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

export default function SocketHandler() {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Conecta ao servidor de WebSocket (mesma porta do app)
      const socket = io();
      
      socket.on('connect', () => {
        console.log('Conectado ao sistema de notificações');
        socket.emit('join_admin', { username: user.username });
      });

      socket.on('new_appointment', (data) => {
        console.log('Novo agendamento recebido via socket:', data);
        
        // Só notifica se for o barbeiro do agendamento ou se for o dono (owner)
        if (user.role === 'owner' || user.barberId === data.barberId) {
          // Notificação Visual
          toast.custom((t) => (
            <div
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-navy-900 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-gold-500/30 border border-gold-500/20 overflow-hidden`}
            >
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="w-10 h-10 bg-gold-500/10 rounded-full flex items-center justify-center border border-gold-500/20">
                      <Bell className="text-gold-500 w-5 h-5" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-gold-500 uppercase tracking-wider">
                      Novo Agendamento!
                    </p>
                    <p className="mt-1 text-sm text-white font-medium">
                      {data.clientName} agendou um serviço.
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(data.date).toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-white/10">
                <button
                  onClick={() => toast.dismiss(t.id)}
                  className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gold-500 hover:text-gold-400 focus:outline-none"
                >
                  Fechar
                </button>
              </div>
            </div>
          ), { duration: 8000 });

          // Notificação Sonora (opcional, mas ajuda muito)
          try {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => console.log('Reprodução de áudio bloqueada pelo navegador'));
          } catch (e) {
            console.error('Erro ao tocar som de notificação:', e);
          }
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  return null; // Este componente não renderiza nada visualmente por si só
}
