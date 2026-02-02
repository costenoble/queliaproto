import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, calculateEquivalent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { Calendar, Zap, MapPin, Building, User, ExternalLink, Home, Map as MapIcon, Loader2 } from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

const PoiEmbedPage = () => {
  const { poiId } = useParams();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch live data (PUSH depuis live_data OU PULL depuis live_data_url)
  const { data: liveData, error: liveError, loading: liveLoading, source } = useHybridLiveData(
    poiId,
    5000
  );

  useEffect(() => {
    const fetchPoi = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            client:clients(id, name, slug, logo_url, primary_color)
          `)
          .eq('id', poiId)
          .single();

        if (error) throw error;
        setPoi(data);
      } catch (err) {
        console.error('Error fetching POI:', err);
        setError('POI non trouvé');
      } finally {
        setLoading(false);
      }
    };

    if (poiId) {
      fetchPoi();
    }
  }, [poiId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !poi) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">POI non trouvé</h1>
          <p className="text-gray-600">Ce point d'intérêt n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    );
  }

  const statusClass = getStatusColorClass(poi.status);
  const energyType = poi.energy_category || poi.type;
  const typeColor = getMarkerColor(energyType);
  const TypeIcon = getMarkerIconComponent(energyType, "w-5 h-5 mr-2");

  const getEnergyLabel = () => {
    if (poi.energy_category) {
      const category = ENERGY_CATEGORIES[poi.energy_category];
      const categoryLabel = category?.label || poi.energy_category;
      if (poi.energy_subtype) {
        return `${categoryLabel} - ${poi.energy_subtype}`;
      }
      return categoryLabel;
    }
    return poi.type || 'Énergie';
  };

  const equivalent = calculateEquivalent(
    poi.nominal_power,
    poi.nominal_power_unit,
    poi.equivalent_display || 'foyers'
  );

  const communesDisplay = poi.communes?.length > 0
    ? poi.communes.join(', ')
    : null;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header with color */}
          <div
            className="h-3 w-full"
            style={{ backgroundColor: typeColor }}
          />

          <div className="p-8">
            {/* Energy type badge */}
            <div className="flex justify-between items-start mb-4">
              <span
                className="text-sm font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider text-white flex items-center shadow-sm"
                style={{ backgroundColor: typeColor }}
              >
                {TypeIcon}
                {getEnergyLabel()}
              </span>
            </div>

            {/* POI Logo */}
            {poi.poi_logo_url && (
              <div className="mb-4">
                <img
                  src={poi.poi_logo_url}
                  alt={poi.name}
                  className="h-16 w-auto object-contain"
                />
              </div>
            )}

            {/* Name */}
            <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {poi.display_name || poi.name}
            </h1>

            {/* Operator */}
            {poi.operator && (
              <div className="flex items-center text-lg text-gray-600 mb-4">
                <User className="w-5 h-5 mr-2 text-gray-400" />
                {poi.operator}
              </div>
            )}

            {/* Status */}
            {poi.status && (
              <div className="mb-6">
                <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${statusClass} capitalize`}>
                  {poi.status}
                </span>
              </div>
            )}

            {/* Location info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
              {/* City/Region */}
              <div className="flex items-center text-gray-700">
                <Building className="w-5 h-5 mr-3 text-gray-400" />
                <span className="font-medium">{poi.city || 'Localisation non spécifiée'}</span>
                {poi.region && <span className="ml-2 text-gray-500">• {poi.region}</span>}
              </div>

              {/* Communes */}
              {communesDisplay && (
                <div className="flex items-center text-gray-600">
                  <Home className="w-5 h-5 mr-3 text-gray-400" />
                  <span>{communesDisplay}</span>
                </div>
              )}

              {/* Address */}
              {poi.address && (
                <div className="flex items-start text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{poi.address}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {poi.description && (
              <p className="text-gray-600 mb-6 leading-relaxed text-lg">
                {poi.description}
              </p>
            )}

            {/* Power & Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Nominal Power */}
              {poi.nominal_power && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <Zap className="w-4 h-4 mr-2" />
                    <span className="text-sm">Puissance nominale</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {poi.nominal_power} <span className="text-lg font-medium">{poi.nominal_power_unit || 'MW'}</span>
                  </span>
                </div>
              )}

              {/* Actual Power (statique) */}
              {poi.actual_power && !liveData && (
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center text-green-600 mb-1">
                    <Zap className="w-4 h-4 mr-2" />
                    <span className="text-sm">Puissance en direct</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {poi.actual_power} <span className="text-lg font-medium">{poi.actual_power_unit || 'MW'}</span>
                  </span>
                </div>
              )}

              {/* Live Data - Temps réel (PUSH ou PULL) */}
              {(liveData || liveLoading || poi.live_data_url) && (
                <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center text-green-600 mb-1">
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    <span className="text-sm font-semibold">Temps réel</span>
                    {source && (
                      <span className="ml-2 text-xs bg-green-200 px-1.5 py-0.5 rounded">
                        {source === 'push' ? 'PUSH' : 'PULL'}
                      </span>
                    )}
                  </div>
                  {liveError ? (
                    <span className="text-sm text-red-600">Erreur de connexion</span>
                  ) : liveLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                      <span className="text-sm text-green-600">Chargement...</span>
                    </div>
                  ) : liveData?.value !== null && liveData?.value !== undefined ? (
                    <span className="text-2xl font-bold text-green-600">
                      {typeof liveData.value === 'number' ? liveData.value.toFixed(2) : liveData.value}{' '}
                      <span className="text-lg font-medium">{liveData.unit || 'kW'}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">Pas de données</span>
                  )}
                </div>
              )}

              {/* Commissioning Year */}
              {poi.commissioning_year && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center text-gray-500 mb-1">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">Mise en service</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{poi.commissioning_year}</span>
                </div>
              )}

              {/* Equivalent */}
              {equivalent && (
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="flex items-center text-indigo-600 mb-1">
                    <MapIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm">Équivalent</span>
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">{equivalent.value}</span>
                  <span className="block text-sm text-indigo-500">{equivalent.label}</span>
                </div>
              )}
            </div>

            {/* Website Link */}
            {poi.project_url && (
              
                href={poi.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center text-white font-medium py-3 px-6 rounded-xl transition-colors"
                style={{ backgroundColor: typeColor }}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Visiter le site web
              </a>
            )}
          </div>

          {/* Footer with client branding */}
          {poi.client && (
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between">
              {poi.client.logo_url ? (
                <img
                  src={poi.client.logo_url}
                  alt={poi.client.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">{poi.client.name}</span>
              )}
              <span className="text-xs text-gray-400">Propulsé par Quelia</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoiEmbedPage;
