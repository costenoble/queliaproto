import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook hybride pour récupérer les données temps réel
 * Supporte 2 approches :
 * 1. PUSH : Lit depuis la table live_data (script Python client)
 * 2. PULL : Interroge l'URL live_data_url du projet
 */
const useHybridLiveData = (projectId, refreshInterval = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null); // 'push' ou 'pull'
  
  const intervalRef = useRef(null);
  const projectRef = useRef(null);

  // Fonction pour récupérer les infos du projet
  const fetchProjectInfo = async () => {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('live_data_url, live_data_path')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      projectRef.current = project;
      return project;
    } catch (err) {
      console.error('Erreur récupération projet:', err);
      return null;
    }
  };

  // Approche PUSH : Lit depuis live_data
  const fetchFromPushData = async () => {
    try {
      const { data: liveData, error } = await supabase
        .from('live_data_latest')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de données trouvées
          return null;
        }
        throw error;
      }

      return {
        value: liveData.value,
        unit: liveData.unit || 'kW',
        timestamp: liveData.timestamp,
        metadata: liveData.metadata
      };
    } catch (err) {
      console.error('Erreur lecture live_data:', err);
      return null;
    }
  };

  // Approche PULL : Interroge l'URL
  const fetchFromPullUrl = async (url, path) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const jsonData = await response.json();

      // Extraire la valeur selon le chemin
      const value = path.split('.').reduce((obj, key) => obj?.[key], jsonData);

      return {
        value: parseFloat(value),
        unit: jsonData.unit || 'kW',
        timestamp: jsonData.timestamp || new Date().toISOString()
      };
    } catch (err) {
      console.error('Erreur fetch URL:', err);
      return null;
    }
  };

  // Fonction principale de récupération
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Essayer d'abord PUSH (live_data)
      const pushData = await fetchFromPushData();
      
      if (pushData) {
        setData(pushData);
        setSource('push');
        setLoading(false);
        return;
      }

      // 2. Si pas de PUSH, essayer PULL (live_data_url)
      if (!projectRef.current) {
        await fetchProjectInfo();
      }

      if (projectRef.current?.live_data_url) {
        const pullData = await fetchFromPullUrl(
          projectRef.current.live_data_url,
          projectRef.current.live_data_path || 'value'
        );

        if (pullData) {
          setData(pullData);
          setSource('pull');
          setLoading(false);
          return;
        }
      }

      // Aucune source disponible
      setError('Aucune source de données disponible');
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Démarrer la récupération périodique
  useEffect(() => {
    if (!projectId) return;

    fetchData();

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [projectId, refreshInterval]);

  return {
    data,
    loading,
    error,
    source, // 'push' ou 'pull'
    refresh: fetchData
  };
};

export default useHybridLiveData;
