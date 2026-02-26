import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'owner' | 'barber';
  barberId?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedAuth = localStorage.getItem('isAdminAuthenticated');
    const storedUser = localStorage.getItem('authUser');
    if (storedAuth === 'true' && storedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string) => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    let loggedUser: User | null = null;

    // Obfuscated credentials (Base64) to "hide" them from casual source inspection
    // Decodes to: admin/admin, leomar/leomar123, pedro/pedro123
    const _c = {
      a: ['YWRtaW4=', 'YWRtaW4='],
      l: ['bGVvbWFy', 'bGVvbWFyMTIz'],
      p: ['cGVkcm8=', 'cGVkcm8xMjM=']
    };

    const decode = (s: string) => atob(s);

    const ADMIN_USER = import.meta.env.VITE_ADMIN_USER || decode(_c.a[0]);
    const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS || decode(_c.a[1]);
    const LEOMAR_USER = import.meta.env.VITE_LEOMAR_USER || decode(_c.l[0]);
    const LEOMAR_PASS = import.meta.env.VITE_LEOMAR_PASS || decode(_c.l[1]);
    const PEDRO_USER = import.meta.env.VITE_PEDRO_USER || decode(_c.p[0]);
    const PEDRO_PASS = import.meta.env.VITE_PEDRO_PASS || decode(_c.p[1]);

    // Leomar - Owner
    if (cleanUsername === LEOMAR_USER && cleanPassword === LEOMAR_PASS) {
      loggedUser = {
        id: '1',
        username: LEOMAR_USER,
        name: 'Leomar',
        role: 'owner',
        barberId: '1'
      };
    } 
    // Pedro - Barber
    else if (cleanUsername === PEDRO_USER && cleanPassword === PEDRO_PASS) {
      loggedUser = {
        id: '2',
        username: PEDRO_USER,
        name: 'Pedro',
        role: 'barber',
        barberId: '2'
      };
    }
    // Legacy admin support
    else if (cleanUsername === ADMIN_USER && cleanPassword === ADMIN_PASS) {
      loggedUser = {
        id: '0',
        username: ADMIN_USER,
        name: 'Administrador',
        role: 'owner'
      };
    }

    if (loggedUser) {
      setIsAuthenticated(true);
      setUser(loggedUser);
      localStorage.setItem('isAdminAuthenticated', 'true');
      localStorage.setItem('authUser', JSON.stringify(loggedUser));
      return true;
    }

    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('authUser');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
