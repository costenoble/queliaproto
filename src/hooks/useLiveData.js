import { useState, useEffect } from 'react';

/**
 * Hook pour récupérer des données en temps réel depuis une URL JSON
 * @param {string} url - URL de l'API qui retourne les données
 * @param {string} path - Chemin vers la valeur dans le JSON (ex: "current_power" ou "data.measurements.power")
 * @param {number} intervalMs - Intervalle de rafraîchissement en millisecondes (défaut: 5000ms = 5 secondes)
 * @returns {object} - { value, error, loading }
 */
export const useLiveData = (url, path = 'current_power', intervalMs = 5000) => {
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Accéder à la valeur selon le path (simple ou imbriqué)
        // Exemple: "current_power" ou "data.measurements.power"
        const extractedValue = path.split('.').reduce((obj, key) => obj?.[key], data);

        setValue(extractedValue);
        setError(null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching live data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Premier appel immédiat
    fetchData();

    // Rafraîchissement périodique
    const interval = setInterval(fetchData, intervalMs);

    // Cleanup à la destruction du composant
    return () => clearInterval(interval);
  }, [url, path, intervalMs]);

  return { value, error, loading };
};
