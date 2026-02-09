
import React from 'react';
import { Link } from 'react-router-dom';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { Building, ExternalLink, Home, Mic, Mail, Loader2, Car, MapPin } from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

const CARS_PER_MW = 67;

const ProjectPopup = ({ poi }) => {
  if (!poi) return null;

  const energyType = poi.energy_category || poi.type;
  const typeColor = getMarkerColor(energyType);
  const TypeIcon = getMarkerIconComponent(energyType, "w-3 h-3 mr-1");

  const { data: liveData, error: liveError, loading: liveLoading, source } = useHybridLiveData(poi.id, 5000);

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

  const getLivePowerMW = () => {
    if (liveData?.value !== null && liveData?.value !== undefined) {
      const unit = liveData.unit || 'MW';
      return unit === 'kW' ? liveData.value / 1000 : liveData.value;
    }
    if (poi.actual_power) {
      return poi.actual_power_unit === 'kW' ? poi.actual_power / 1000 : poi.actual_power;
    }
    return null;
  };
  const livePowerMW = getLivePowerMW();
  const carsCount = livePowerMW ? Math.round(livePowerMW * CARS_PER_MW) : null;

  // Tronquer la description à 150 caractères
  const truncatedDescription = poi.description
    ? (poi.description.length > 150 ? poi.description.slice(0, 150) + '...' : poi.description)
    : null;

  return (
    <div className="w-[520px] max-w-[95vw] bg-white font-sans rounded-2xl shadow-2xl max-h-[80vh] flex flex-col overflow-hidden">
      {/* Barre de couleur */}
      <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: typeColor }} />

      <div className="overflow-y-auto overflow-x-hidden flex-1 p-5 space-y-3.5">
        {/* En-tête : Badge + Logo */}
        <div className="flex items-start justify-between gap-3">
          <span
            className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-md uppercase tracking-wide text-white shadow-sm flex-shrink-0"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            {getEnergyLabel()}
          </span>
          {poi.poi_logo_url && (
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 shadow-sm flex-shrink-0 max-w-[140px]">
              <img
                src={poi.poi_logo_url}
                alt={poi.name}
                className="h-14 w-auto max-w-full object-contain"
              />
            </div>
          )}
        </div>

        {/* Nom du parc */}
        <h3 className="text-base font-bold text-gray-900 leading-tight">
          {poi.display_name || poi.name}
        </h3>

        {/* Terrestre/Maritime + Statut */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{terrainLabel}</span>
          {poi.status && (
            <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${getStatusColorClass(poi.status)} capitalize`}>
              {poi.status}
            </span>
          )}
        </div>

        {/* Séparateur */}
        <div className="border-t border-gray-200" />

        {/* Localisation */}
        <div className="flex items-center text-xs text-gray-600">
          <Building className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
          <span className="truncate">
            {poi.city && (
              <Link to={`/map?city=${encodeURIComponent(poi.city)}`} className="hover:text-indigo-600 hover:underline font-medium">
                {poi.city}
              </Link>
            )}
            {poi.city && poi.region && ' • '}
            {poi.region && (
              <Link to={`/map?region=${encodeURIComponent(poi.region)}`} className="hover:text-indigo-600 hover:underline">
                {poi.region}
              </Link>
            )}
            {!poi.city && !poi.region && 'Non spécifiée'}
          </span>
        </div>

        {/* Coordonnées GPS - cliquables vers Google Maps */}
        {poi.lat && poi.lng && (
          <a
            href={`https://www.google.com/maps?q=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-[11px] text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
            <span className="hover:underline">{poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}</span>
          </a>
        )}

        {/* Séparateur */}
        <div className="border-t border-gray-200" />

        {/* Puissance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-[10px] text-gray-500 mb-0.5">Capacité nominale</div>
            <div className="text-sm font-bold text-gray-900">
              {poi.nominal_power ? `${poi.nominal_power} ${poi.nominal_power_unit || 'MW'}` : '---'}
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-2.5 border border-green-200">
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              <span className="text-[10px] text-gray-600 font-medium">Temps réel</span>
              {(liveData?.value !== null && liveData?.value !== undefined) && (
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
              )}
              {source && (
                <span className="text-[8px] bg-green-600 text-white px-1 py-0.5 rounded font-semibold">
                  {source === 'push' ? 'PUSH' : 'PULL'}
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-green-700">
              {liveError ? (
                <span className="text-red-500 text-xs">Erreur</span>
              ) : liveLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : liveData?.value !== null && liveData?.value !== undefined ? (
                `${typeof liveData.value === 'number' ? liveData.value.toFixed(1) : liveData.value} ${liveData.unit || 'MW'}`
              ) : poi.actual_power ? (
                `${poi.actual_power} ${poi.actual_power_unit || 'MW'}`
              ) : '---'}
            </div>
          </div>
        </div>

        {/* Voitures */}
        {carsCount !== null && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-600 bg-blue-50 rounded-lg p-2 border border-blue-100">
            <Car className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="truncate">≈ <span className="font-bold text-blue-700">{carsCount.toLocaleString('fr-FR')}</span> voitures à 100 km/h</span>
          </div>
        )}

        {/* Description */}
        {truncatedDescription && (
          <>
            <div className="border-t border-gray-200" />
            <p className="text-xs text-gray-700 leading-relaxed">
              {truncatedDescription}
            </p>
          </>
        )}

        {/* Liens */}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          {poi.project_url ? (
            <a
              href={poi.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Site web
            </a>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2.5">
            <a href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`} className="text-indigo-600 hover:text-indigo-800 transition-colors" title="Signaler par email">
              <Mail className="w-4 h-4" />
            </a>
            <a
              href="https://app.ekoo.co/capture?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiIwOGQ2NmZkMy01M2U0LTQ5YzAtYTkzMS03NjU2ZWYzYTgwMzciLCJwcm9kdWN0X2lkIjoiYjM5MDY1MTktODJiZC00YzdjLTliYTktN2Y4MWFmYTkyZDJkIiwidHlwZSI6InJldmlldyIsImlhdCI6MTcyNzI3ODAxOX0.D3j-mGrgBYl-HW4rBBQid-E-q9sQonuboWXb9eZzuvA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 transition-colors"
              title="Signaler par vocal"
            >
              <Mic className="w-4 h-4" />
            </a>
            <a
              href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:text-indigo-800 underline transition-colors font-medium"
            >
              Newsletter
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPopup;
