
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer le profil utilisateur depuis user_profiles
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          client:clients(id, name, slug, logo_url, primary_color)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      }

      setIsLoading(false);
    };

    checkSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        const profile = await fetchUserProfile(user.id);
        setUserProfile(profile);
      } else {
        setUserProfile(null);
      }

      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Récupérer le profil après connexion
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        setUserProfile(profile);
      }

      return { success: true, data };
    } catch (error) {
      console.error("Login failed:", error.message);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUserProfile(null);
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  // Helpers pour vérifier le rôle
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isClient = userProfile?.role === 'client';

  const value = {
    currentUser,
    userProfile,
    isAuthenticated: !!currentUser,
    isSuperAdmin,
    isClient,
    clientId: userProfile?.client_id,
    clientInfo: userProfile?.client,
    login,
    logout,
    isLoading,
    refreshProfile: () => currentUser && fetchUserProfile(currentUser.id).then(setUserProfile)
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
