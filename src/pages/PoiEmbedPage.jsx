import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { Building, ExternalLink, Home, Mic, Mail, Loader2, Car } from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

// Même ratio que dans ProjectPopup : 10.12 MW = 264 voitures à 80 km/h
const CARS_PER_MW = 264 / 10.12;

const PoiEmbedPage = () => {
  const { poiId } = useParams();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { data: liveData, error: liveError, loading: liveLoading, source } = useHybridLiveData(poiId, 5000);

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

    if (poiId) fetchPoi();
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

  const energyType = poi.energy_category || poi.type;
  const typeColor = getMarkerColor(energyType);
  const TypeIcon = getMarkerIconComponent(energyType, "w-5 h-5 mr-2");

  const getEnergyLabel = () => {
    if (poi.energy_category) {
      const category = ENERGY_CATEGORIES[poi.energy_category];
      const categoryLabel = category?.label || poi.energy_category;
      if (poi.energy_subtype) return `${categoryLabel} - ${poi.energy_subtype}`;
      return categoryLabel;
    }
    return poi.type || 'Énergie';
  };

  const terrainLabel = poi.energy_subtype?.toLowerCase().includes('off shore') ? 'Maritime' : 'Terrestre';

  const locationParts = [poi.city, poi.region].filter(Boolean);

  const nominalPowerMW = poi.nominal_power
    ? (poi.nominal_power_unit === 'kW' ? poi.nominal_power / 1000 : poi.nominal_power)
    : null;

  const carsCount = nominalPowerMW ? Math.round(nominalPowerMW * CARS_PER_MW) : null;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Barre de couleur */}
          <div className="h-3 w-full" style={{ backgroundColor: typeColor }} />

          <div className="p-8">
            {/* Badge type d'énergie (gauche) + Logo (haut à droite) */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <span
                className="text-sm font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider text-white flex items-center shadow-sm"
                style={{ backgroundColor: typeColor }}
              >
                {TypeIcon}
                {getEnergyLabel()}
              </span>
              {poi.poi_logo_url && (
                <img
                  src={poi.poi_logo_url}
                  alt={poi.name}
                  className="h-18 w-auto object-contain rounded-lg border border-gray-100 shadow-sm flex-shrink-0"
                  style={{ maxHeight: '4.5rem' }}
                />
              )}
            </div>

            {/* Nom du parc */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-1">
              {poi.display_name || poi.name}
            </h1>

            {/* Terrestre / Maritime + Statut */}
            <div className="flex items-center gap-2 mb-4 mt-0.5">
              <span className="text-base text-gray-500">{terrainLabel}</span>
              {poi.status && (
                <span className={`text-sm px-3 py-0.5 rounded-full border font-medium ${getStatusColorClass(poi.status)} capitalize`}>
                  {poi.status}
                </span>
              )}
            </div>

            {/* Ville / Agglomération */}
            <div className="mb-5">
              <div className="flex items-center text-base text-gray-600">
                <Building className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                <span>{locationParts.join(' • ') || 'Localisation non spécifiée'}</span>
              </div>
              {poi.intercommunalites?.length > 0 && (
                <div className="text-sm text-gray-500 mt-0.5 pl-6">
                  {poi.intercommunalites.join(', ')}
                </div>
              )}
              {poi.communes?.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 mt-0.5 pl-5">
                  <Home className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  {poi.communes.join(', ')}
                </div>
              )}
            </div>

            {/* Puissance : Capacité nominale (gauche) | Production temps réel (droite) */}
            <div className="grid grid-cols-2 gap-6 mb-1">
              <div>
                <span className="block text-sm text-gray-500 mb-0.5">Capacité nominale</span>
                {poi.nominal_power ? (
                  <span className="text-xl font-bold text-gray-900">
                    {poi.nominal_power} <span className="text-base font-medium">{poi.nominal_power_unit || 'MW'}</span>
                  </span>
                ) : (
                  <span className="text-base text-gray-400">---</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm text-gray-500">Production temps réel</span>
                  {source && (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                      {source === 'push' ? 'PUSH' : 'PULL'}
                    </span>
                  )}
                </div>
                {liveError ? (
                  <span className="text-sm text-red-600">Erreur</span>
                ) : liveLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                ) : liveData?.value !== null && liveData?.value !== undefined ? (
                  <span className="text-xl font-bold text-green-600">
                    {typeof liveData.value === 'number' ? liveData.value.toFixed(2) : liveData.value}{' '}
                    <span className="text-base font-medium">{liveData.unit || 'MW'}</span>
                  </span>
                ) : poi.actual_power ? (
                  <span className="text-xl font-bold text-green-600">
                    {poi.actual_power} <span className="text-base font-medium">{poi.actual_power_unit || 'MW'}</span>
                  </span>
                ) : (
                  <span className="text-base text-gray-400">---</span>
                )}
              </div>
            </div>

            {/* Équivalent voitures à 80 km/h — aligné à droite */}
            {carsCount !== null && (
              <div className="flex justify-end mb-4">
                <span className="text-sm text-gray-500 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-700">{carsCount.toLocaleString('fr-FR')}</span> voitures à 80 km/h
                </span>
              </div>
            )}

            {/* Description */}
            {poi.description && (
              <p className="text-base text-gray-600 leading-relaxed border-t border-b border-gray-100 py-4 mb-4">
                {poi.description}
              </p>
            )}

            {/* Lien site web */}
            {poi.project_url && (
              <div className="mb-4">
                <a
                  href={poi.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-base text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Voir le site web
                </a>
              </div>
            )}

            {/* Contact + Mailing + Propulsé par Quelia */}
            <div className="border-t border-gray-100 pt-4 mt-3 space-y-3">
              <a
                href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`}
                className="flex items-center text-base text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <Mail className="w-5 h-5 mr-2.5 text-gray-400 flex-shrink-0" />
                <span>Faites-nous le savoir par mail</span>
              </a>
              <a
                href="https://app.ekoo.co/capture?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiIwOGQ2NmZkMy01M2U0LTQ5YzAtYTkzMS03NjU2ZWYzYTgwMzciLCJwcm9kdWN0X2lkIjoiYjM5MDY1MTktODJiZC00YzdjLTliYTktN2Y4MWFmYTkyZDJkIiwidHlwZSI6InJldmlldyIsImlhdCI6MTcyNzI3ODAxOX0.D3j-mGrgBYl-HW4rBBQid-E-q9sQonuboWXb9eZzuvA"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-base text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <Mic className="w-5 h-5 mr-2.5 text-gray-400 flex-shrink-0" />
                <span>Faites-nous le savoir par vocal</span>
              </a>
              <a
                href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-base text-indigo-600 hover:text-indigo-800 transition-colors pt-3 border-t border-gray-100"
              >
                <span>Vous voulez des infos ? <span className="font-semibold underline">Inscrivez votre email</span> à la liste de diffusion</span>
              </a>
              <a
                href="https://quelia.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center text-sm text-gray-400 hover:text-indigo-500 transition-colors pt-3 border-t border-gray-100"
              >
                Propulsé par <span className="font-semibold ml-1 text-gray-600">Quelia</span>
              </a>
            </div>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoiEmbedPage;
