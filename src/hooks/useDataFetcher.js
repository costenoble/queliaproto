
import { useState, useEffect, useCallback, useRef } from 'react';

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff in ms

export const useDataFetcher = (url, interval = 60000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const previousDataRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      
      // Only update if data has changed (prevent unnecessary re-renders)
      const dataString = JSON.stringify(jsonData);
      if (dataString !== previousDataRef.current) {
        setData(jsonData);
        previousDataRef.current = dataString;
      }
      
      setLoading(false);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
      setLoading(false);

      // Implement retry with exponential backoff
      if (retryCount < RETRY_DELAYS.length) {
        const delay = RETRY_DELAYS[retryCount];
        console.log(`Retrying in ${delay}ms... (attempt ${retryCount + 1})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData();
        }, delay);
      }
    }
  }, [url, retryCount]);

  // Initial fetch and set up polling
  useEffect(() => {
    // Reset state if URL is removed
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    // Initial fetch
    fetchData();

    // Set up polling interval
    if (interval > 0) {
      intervalRef.current = setInterval(fetchData, interval);
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [url, interval, fetchData]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};
