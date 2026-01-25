
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
  const [isProcessing, setIsProcessing] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const hash = window.location.hash;

    // Check if there's an access_token in the URL hash (from email confirmation)
    if (hash && hash.includes('access_token')) {
      setIsProcessing(true);

      // Import supabase to process the token
      import('@/lib/customSupabaseClient').then(({ supabase }) => {
        // Supabase automatically processes the hash when we call getSession
        supabase.auth.getSession().then(({ data: { session } }) => {
          // Clean the URL by removing the hash
          if (session) {
            // Session established - redirect to admin
            window.history.replaceState(null, '', '/admin');
            window.location.reload();
          } else {
            // No session - redirect to login
            window.history.replaceState(null, '', '/login');
            window.location.reload();
          }
        });
      });
    }
  }, [location]);

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirmation en cours...</p>
        </div>
      </div>
    );
  }

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
