
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lock, Mail, ShieldCheck } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { validateAdminSetup } from '@/utils/adminDebug';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      console.log("Attempting login for:", email);
      const result = await login(email, password);
      
      if (result.success) {
        console.log("Login successful, redirecting...");
        navigate('/admin');
      } else {
        console.error("Login failed result:", result);
        setError(result.error || 'Identifiants invalides ou erreur de connexion.');
      }
    } catch (err) {
      console.error("Unexpected login error:", err);
      setError('Une erreur technique est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConfig = async () => {
    setIsValidating(true);
    setError('');
    try {
      const results = await validateAdminSetup();
      if (results.errors.length > 0) {
        setError(`Configuration issue: ${results.errors[0]}`);
      } else {
        alert("Configuration valide ! Vérifiez la console pour les détails.");
      }
    } catch (e) {
      setError("Erreur lors du test de configuration.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <Helmet>
        <title>Connexion Administration - Quelia</title>
      </Helmet>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Administration
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Connectez-vous pour gérer les projets
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border"
                  placeholder="admin@quelia.fr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 border"
                />
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
               <button
                 type="button"
                 onClick={handleTestConfig}
                 disabled={isValidating}
                 className="w-full flex items-center justify-center text-xs text-gray-500 hover:text-indigo-600 transition-colors"
               >
                 <ShieldCheck className="w-3 h-3 mr-1" />
                 {isValidating ? 'Vérification en cours...' : 'Vérifier la configuration Admin & RLS'}
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
