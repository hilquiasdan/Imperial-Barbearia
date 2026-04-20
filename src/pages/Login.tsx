import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleReset = async () => {
    try {
      const response = await fetch('/api/debug/reset-db');
      const data = await response.json();
      setResetMessage(data.message || data.error);
      setTimeout(() => setResetMessage(''), 3000);
    } catch (e) {
      setResetMessage('Erro ao resetar banco');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Preencha todos os campos');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Usuário ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-navy-800 rounded-2xl shadow-2xl overflow-hidden border border-white/5">
        <div className="bg-navy-900 p-6 text-center border-b border-white/5 relative">
          <button 
            onClick={() => navigate('/')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold text-white">Painel Administrativo</h2>
          <p className="text-xs text-gold-500 uppercase tracking-widest mt-1">Acesso Restrito</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2 group"
          >
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-gold-500 transition-colors group-focus-within:animate-pulse">Usuário</label>
            <motion.div 
              whileFocus={{ scale: 1.01 }}
              className="relative"
            >
              <motion.div 
                animate={{ y: [0, -1, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500"
              >
                <User size={20} />
              </motion.div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-navy-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all focus:shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                placeholder="Digite seu usuário"
              />
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2 group"
          >
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider ml-1 group-focus-within:text-gold-500 transition-colors group-focus-within:animate-pulse">Senha</label>
            <motion.div 
              whileFocus={{ scale: 1.01 }}
              className="relative"
            >
              <motion.div 
                animate={{ y: [0, -1, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500"
              >
                <Lock size={20} />
              </motion.div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-navy-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all focus:shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                placeholder="Digite sua senha"
              />
            </motion.div>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gold-500 text-navy-900 font-bold py-4 rounded-xl shadow-lg hover:bg-gold-400 transition-colors uppercase tracking-wider text-sm"
          >
            Entrar no Painel
          </motion.button>

          {/* Debug reset removed for security */}
        </form>
      </div>
    </div>
  );
}
