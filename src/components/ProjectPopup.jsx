
import React from 'react';
import { Link } from 'react-router-dom';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { Building, ExternalLink, Home, Mic, Mail, Loader2, Car } from 'lucide-react';
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

  // Tronquer la description à 80 caractères
  const truncatedDescription = poi.description
    ? (poi.description.length > 80 ? poi.description.slice(0, 80) + '...' : poi.description)
    : null;

  return (
    <div className="w-72 bg-white overflow-hidden font-sans rounded-lg shadow-sm">
      {/* Barre de couleur */}
      <div className="h-2 w-full" style={{ backgroundColor: typeColor }} />

      <div className="p-4 space-y-2.5">
        {/* En-tête : Badge + Logo */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-white"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            {getEnergyLabel()}
          </span>
          {poi.poi_logo_url && (
            <img
              src={poi.poi_logo_url}
              alt={poi.name}
              className="h-8 w-auto object-contain rounded border border-gray-100 flex-shrink-0"
            />
          )}
        </div>

        {/* Nom du parc */}
        <h3 className="text-sm font-bold text-gray-900 leading-tight">
          {poi.display_name || poi.name}
        </h3>

        {/* Terrestre/Maritime + Statut */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-gray-500">{terrainLabel}</span>
          {poi.status && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getStatusColorClass(poi.status)} capitalize`}>
              {poi.status}
            </span>
          )}
        </div>

        {/* Localisation */}
        <div className="flex items-center text-[11px] text-gray-600">
          <Building className="w-3 h-3 mr-1 text-gray-400 flex-shrink-0" />
          <span>
            {poi.city && (
              <Link to={`/map?city=${encodeURIComponent(poi.city)}`} className="hover:text-indigo-600 hover:underline">
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

        {/* Séparateur */}
        <div className="border-t border-gray-100" />

        {/* Puissance */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-gray-500">Capacité</div>
            <div className="text-xs font-semibold text-gray-900">
              {poi.nominal_power ? `${poi.nominal_power} ${poi.nominal_power_unit || 'MW'}` : '---'}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-500">Temps réel</span>
              {source && (
                <span className="text-[8px] bg-green-100 text-green-700 px-1 rounded font-medium">
                  {source === 'push' ? 'PUSH' : 'PULL'}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-green-600">
              {liveError ? (
                <span className="text-red-500">Erreur</span>
              ) : liveLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
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
          <div className="flex items-center justify-end gap-1 text-[10px] text-gray-500">
            <Car className="w-3 h-3" />
            <span><span className="font-semibold text-gray-700">{carsCount.toLocaleString('fr-FR')}</span> voitures à 100 km/h</span>
          </div>
        )}

        {/* Description */}
        {truncatedDescription && (
          <>
            <div className="border-t border-gray-100" />
            <p className="text-[10px] text-gray-600 leading-snug">
              {truncatedDescription}
            </p>
          </>
        )}

        {/* Liens */}
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between">
          {poi.project_url ? (
            <a
              href={poi.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[10px] text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <ExternalLink className="w-3 h-3 mr-0.5" />
              Site web
            </a>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <a href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`} className="text-indigo-600 hover:text-indigo-800" title="Signaler par email">
              <Mail className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://app.ekoo.co/capture?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiIwOGQ2NmZkMy01M2U0LTQ5YzAtYTkzMS03NjU2ZWYzYTgwMzciLCJwcm9kdWN0X2lkIjoiYjM5MDY1MTktODJiZC00YzdjLTliYTktN2Y4MWFmYTkyZDJkIiwidHlwZSI6InJldmlldyIsImlhdCI6MTcyNzI3ODAxOX0.D3j-mGrgBYl-HW4rBBQid-E-q9sQonuboWXb9eZzuvA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800"
              title="Signaler par vocal"
            >
              <Mic className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-indigo-600 hover:text-indigo-800 underline"
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
