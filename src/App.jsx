
import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster.jsx';
import Navbar from '@/components/Navbar.jsx';
import Footer from '@/components/Footer.jsx';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Pages
import MapPage from '@/pages/MapPage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import AdminPage from '@/pages/AdminPage.jsx';

import '@/animations.css';

// ScrollToTop component to reset scroll on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Handle auth callback (email confirmation redirect)
const AuthCallbackHandler = () => {
  React.useEffect(() => {
    // Check if there's an access_token in the URL hash (from email confirmation)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      // Let Supabase process the token first, then clean URL and redirect
      setTimeout(() => {
        // Remove the hash and redirect to clean /login URL
        window.location.replace('/login');
      }, 500);
    }
  }, []);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Layout component to wrap pages with Nav and Footer
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50">
      <Navbar />
      <main className="flex-grow flex flex-col w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AuthCallbackHandler />
        <Routes>
          {/* Carte interactive - Page principale */}
          <Route path="/" element={<Layout><MapPage /></Layout>} />

          {/* Auth */}
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback - redirige vers la carte */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
