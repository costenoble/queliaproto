import React from 'react';
import { Activity, Zap, AlertCircle, Loader2, Wifi, WifiOff } from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

const LiveDataDisplay = ({ projectId, className = '' }) => {
  const { data, loading, error, source } = useHybridLiveData(projectId, 5000);

  if (loading && !data) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span className="text-sm italic">Données non disponibles</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`flex items-center gap-2 text-gray-400 ${className}`}>
        <Activity className="w-4 h-4" />
        <span className="text-sm italic">Aucune donnée</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        {source === 'push' ? (
          <Wifi className="w-4 h-4 text-green-500" title="Données en temps réel (PUSH)" />
        ) : (
          <Activity className="w-4 h-4 text-blue-500" title="Données via API (PULL)" />
        )}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">
            {typeof data.value === 'number' ? data.value.toFixed(2) : data.value}
          </span>
          <span className="text-sm font-medium text-gray-600">
            {data.unit}
          </span>
        </div>
      </div>
      
      {data.timestamp && (
        <span className="text-xs text-gray-400">
          {new Date(data.timestamp).toLocaleTimeString('fr-FR')}
        </span>
      )}
    </div>
  );
};

export default LiveDataDisplay;
