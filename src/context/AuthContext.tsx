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

    // Leomar - Owner
    if (cleanUsername === 'leomar' && cleanPassword === 'leomar123') {
      loggedUser = {
        id: '1',
        username: 'leomar',
        name: 'Leomar',
        role: 'owner',
        barberId: '1'
      };
    } 
    // Pedro - Barber
    else if (cleanUsername === 'pedro' && cleanPassword === 'pedro123') {
      loggedUser = {
        id: '2',
        username: 'pedro',
        name: 'Pedro',
        role: 'barber',
        barberId: '2'
      };
    }
    // Legacy admin support
    else if (cleanUsername === 'admin' && cleanPassword === 'admin') {
      loggedUser = {
        id: '0',
        username: 'admin',
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
