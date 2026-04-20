import React, { Suspense, lazy, Component, ErrorInfo } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { MessageCircle, Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SocketHandler from './components/SocketHandler';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { motion } from 'framer-motion';

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<any>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-navy-800 border border-gold-500/20 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="text-gold-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-serif mb-4">Ops! Algo deu errado.</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Ocorreu um erro inesperado. Isso pode ser devido a uma instabilidade temporária ou limite de taxa excedido.
          </p>
          {error && (
            <div className="bg-black/20 p-4 rounded-lg mb-8 text-left overflow-auto max-h-32">
              <code className="text-xs text-red-400">{error.toString()}</code>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-gold-500 text-navy-900 font-bold rounded-xl hover:bg-gold-400 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
          >
            <RefreshCcw size={18} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Services = lazy(() => import('./pages/Services'));
const Booking = lazy(() => import('./pages/Booking'));
const About = lazy(() => import('./pages/About'));
const Location = lazy(() => import('./pages/Location'));
const Admin = lazy(() => import('./pages/Admin'));
const Login = lazy(() => import('./pages/Login'));

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-gold-500 animate-spin" />
      <p className="text-gold-500 font-medium animate-pulse">Carregando...</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname.startsWith('/admin');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className="flex flex-col min-h-screen">
      {!isAuthPage && <Navbar />}
      <main className="flex-grow">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/servicos" element={<Services />} />
            <Route path="/agendar" element={<Booking />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/localizacao" element={<Location />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Suspense>
      </main>
      {!isAuthPage && <Footer />}
      
      {/* Floating WhatsApp Button - Only on Home Page */}
      {location.pathname === '/' && (
        <motion.a
          href="https://wa.me/5581984361210"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.15, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 left-6 z-50 bg-green-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all duration-300 flex items-center justify-center"
          aria-label="Contato WhatsApp"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <MessageCircle size={32} fill="white" />
          </motion.div>
        </motion.a>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <SocketHandler />
          <AppContent />
          <Toaster position="top-right" reverseOrder={false} />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
