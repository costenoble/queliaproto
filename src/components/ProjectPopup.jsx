
import React from 'react';
import { Link } from 'react-router-dom';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { Building, ExternalLink, Home, Mic, Mail, Loader2, Car } from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

// Ratio voitures compactes à 100 km/h : puissance MW × 67
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
  const locationParts = [poi.city, poi.region].filter(Boolean);

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

  return (
    <div className="w-64 bg-white overflow-hidden font-sans rounded-lg shadow-sm">
      {/* Barre de couleur */}
      <div className="h-1.5 w-full" style={{ backgroundColor: typeColor }}></div>

      <div className="p-3">
        {/* Badge + Logo */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
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

        {/* Nom */}
        <h3 className="text-base font-bold text-gray-900 leading-tight">
          {poi.display_name || poi.name}
        </h3>

        {/* Terrestre/Maritime + Statut */}
        <div className="flex items-center gap-1.5 mb-2 mt-0.5">
          <span className="text-xs text-gray-500">{terrainLabel}</span>
          {poi.status && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getStatusColorClass(poi.status)} capitalize`}>
              {poi.status}
            </span>
          )}
        </div>

        {/* Localisation */}
        <div className="mb-2">
          <div className="flex items-center text-xs text-gray-600">
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
          {poi.intercommunalites?.length > 0 && (
            <div className="text-[10px] text-gray-500 mt-0.5 pl-4">
              {poi.intercommunalites.slice(0, 2).map((interco, i) => (
                <span key={interco}>
                  <Link to={`/map?intercommunalite=${encodeURIComponent(interco)}`} className="hover:text-indigo-600 hover:underline">
                    {interco}
                  </Link>
                  {i < Math.min(poi.intercommunalites.length, 2) - 1 && ', '}
                </span>
              ))}
              {poi.intercommunalites.length > 2 && ` +${poi.intercommunalites.length - 2}`}
            </div>
          )}
          {poi.communes?.length > 0 && (
            <div className="flex items-center text-[10px] text-gray-500 mt-0.5 pl-3">
              <Home className="w-2.5 h-2.5 mr-0.5 text-gray-400" />
              {poi.communes.slice(0, 2).map((commune, i) => (
                <span key={commune}>
                  <Link to={`/map?commune=${encodeURIComponent(commune)}`} className="hover:text-indigo-600 hover:underline">
                    {commune}
                  </Link>
                  {i < Math.min(poi.communes.length, 2) - 1 && ', '}
                </span>
              ))}
              {poi.communes.length > 2 && ` +${poi.communes.length - 2}`}
            </div>
          )}
        </div>

        {/* Puissance */}
        <div className="grid grid-cols-2 gap-2 mb-1">
          <div>
            <span className="block text-[10px] text-gray-500">Capacité</span>
            {poi.nominal_power ? (
              <span className="text-xs font-semibold text-gray-900">{poi.nominal_power} {poi.nominal_power_unit || 'MW'}</span>
            ) : (
              <span className="text-xs text-gray-400">---</span>
            )}
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
            {liveError ? (
              <span className="text-[10px] text-red-600">Erreur</span>
            ) : liveLoading ? (
              <Loader2 className="w-3 h-3 animate-spin text-green-600" />
            ) : liveData?.value !== null && liveData?.value !== undefined ? (
              <span className="text-xs font-semibold text-green-600">
                {typeof liveData.value === 'number' ? liveData.value.toFixed(1) : liveData.value} {liveData.unit || 'MW'}
              </span>
            ) : poi.actual_power ? (
              <span className="text-xs font-semibold text-green-600">{poi.actual_power} {poi.actual_power_unit || 'MW'}</span>
            ) : (
              <span className="text-xs text-gray-400">---</span>
            )}
          </div>
        </div>

        {/* Voitures */}
        {carsCount !== null && (
          <div className="flex justify-end mb-2">
            <span className="text-[10px] text-gray-500 flex items-center gap-0.5">
              <Car className="w-3 h-3 text-gray-600" />
              <span className="font-semibold text-gray-700">{carsCount.toLocaleString('fr-FR')}</span> voitures à 100 km/h
            </span>
          </div>
        )}

        {/* Description (tronquée) */}
        {poi.description && (
          <p className="text-[10px] text-gray-600 leading-relaxed border-t border-gray-100 py-2 mb-2 line-clamp-2">
            {poi.description}
          </p>
        )}

        {/* Site web */}
        {poi.project_url && (
          <a
            href={poi.project_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-xs text-indigo-600 hover:text-indigo-800 font-medium mb-2"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Site web
          </a>
        )}

        {/* Contact compact */}
        <div className="border-t border-gray-100 pt-2 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-1.5 text-gray-600">
            <span>Signalement</span>
            <a href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`} className="text-indigo-600 hover:text-indigo-800" title="Email">
              <Mail className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://app.ekoo.co/capture?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWQiOiIwOGQ2NmZkMy01M2U0LTQ5YzAtYTkzMS03NjU2ZWYzYTgwMzciLCJwcm9kdWN0X2lkIjoiYjM5MDY1MTktODJiZC00YzdjLTliYTktN2Y4MWFmYTkyZDJkIiwidHlwZSI6InJldmlldyIsImlhdCI6MTcyNzI3ODAxOX0.D3j-mGrgBYl-HW4rBBQid-E-q9sQonuboWXb9eZzuvA"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800"
              title="Vocal"
            >
              <Mic className="w-3.5 h-3.5" />
            </a>
          </div>
          <a
            href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline"
          >
            Newsletter
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectPopup;
