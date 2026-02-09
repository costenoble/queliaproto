import React from 'react';
import { Link } from 'react-router-dom';
import {
  getStatusColorClass,
  getMarkerColor,
  getMarkerIconComponent,
  ENERGY_CATEGORIES
} from '@/utils/mapUtils.jsx';
import {
  Building,
  ExternalLink,
  Mic,
  Mail,
  Loader2,
  Car,
  MapPin
} from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

const CARS_PER_MW = 67;

const ProjectPopup = ({ poi }) => {
  const { data: liveData, error: liveError, loading: liveLoading, source } =
    useHybridLiveData(poi?.id, 5000);

  if (!poi) return null;

  const energyType = poi.energy_category || poi.type;
  const typeColor = getMarkerColor(energyType);
  const TypeIcon = getMarkerIconComponent(energyType, 'w-3 h-3 mr-1');

  const getEnergyLabel = () => {
    if (poi.energy_category) {
      const category = ENERGY_CATEGORIES[poi.energy_category];
      const label = category?.label || poi.energy_category;
      return poi.energy_subtype ? `${label} - ${poi.energy_subtype}` : label;
    }
    return poi.type || 'Énergie';
  };

  const terrainLabel = poi.energy_subtype?.toLowerCase().includes('off shore')
    ? 'Maritime'
    : 'Terrestre';

  const getLivePowerMW = () => {
    if (liveData?.value != null) {
      return liveData.unit === 'kW' ? liveData.value / 1000 : liveData.value;
    }
    if (poi.actual_power) {
      return poi.actual_power_unit === 'kW'
        ? poi.actual_power / 1000
        : poi.actual_power;
    }
    return null;
  };

  const livePowerMW = getLivePowerMW();
  const carsCount = livePowerMW
    ? Math.round(livePowerMW * CARS_PER_MW)
    : null;

  const truncatedDescription =
    poi.description?.length > 150
      ? poi.description.slice(0, 150) + '…'
      : poi.description;

  return (
    <div
      className="
        w-[380px]
        sm:w-[420px]
        lg:w-[460px]
        max-w-[95vw]
        bg-white
        rounded-2xl
        shadow-xl
        font-sans
      "
    >
      {/* Barre couleur */}
      <div className="h-1.5 w-full rounded-t-2xl" style={{ backgroundColor: typeColor }} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <span
            className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded uppercase tracking-wide text-white shadow-sm"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            {getEnergyLabel()}
          </span>

          {poi.poi_logo_url && (
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 max-w-[120px]">
              <img
                src={poi.poi_logo_url}
                alt={poi.name}
                className="h-14 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Titre */}
        <h3 className="text-base font-bold text-gray-900 leading-snug">
          {poi.display_name || poi.name}
        </h3>

        {/* Type + statut */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">{terrainLabel}</span>
          {poi.status && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${getStatusColorClass(
                poi.status
              )}`}
            >
              {poi.status}
            </span>
          )}
        </div>

        <div className="border-t border-gray-200" />

        {/* Localisation */}
        <div className="flex items-center text-xs text-gray-600">
          <Building className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
          <span className="truncate">
            {poi.city && (
              <Link
                to={`/map?city=${encodeURIComponent(poi.city)}`}
                className="hover:underline hover:text-indigo-600 font-medium"
              >
                {poi.city}
              </Link>
            )}
            {poi.city && poi.region && ' • '}
            {poi.region && (
              <Link
                to={`/map?region=${encodeURIComponent(poi.region)}`}
                className="hover:underline hover:text-indigo-600"
              >
                {poi.region}
              </Link>
            )}
            {!poi.city && !poi.region && 'Non spécifiée'}
          </span>
        </div>

        {poi.lat && poi.lng && (
          <a
            href={`https://www.google.com/maps?q=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-[11px] text-gray-500 hover:text-indigo-600"
          >
            <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
            {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
          </a>
        )}

        <div className="border-t border-gray-200" />

        {/* Puissance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-2.5">
            <div className="text-[10px] text-gray-500">Capacité nominale</div>
            <div className="text-sm font-bold">
              {poi.nominal_power
                ? `${poi.nominal_power} ${poi.nominal_power_unit || 'MW'}`
                : '—'}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-2.5 border border-green-200">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-[10px] text-gray-600">Temps réel</span>
              {liveData?.value != null && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
              )}
              {source && (
                <span className="text-[8px] bg-green-600 text-white px-1 rounded">
                  {source.toUpperCase()}
                </span>
              )}
            </div>

            <div className="text-sm font-bold text-green-700">
              {liveError
                ? 'Erreur'
                : liveLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : liveData?.value != null
                    ? `${liveData.value.toFixed(1)} ${liveData.unit || 'MW'}`
                    : poi.actual_power
                      ? `${poi.actual_power} ${poi.actual_power_unit || 'MW'}`
                      : '—'}
            </div>
          </div>
        </div>

        {carsCount && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] bg-blue-50 rounded-lg p-2 border border-blue-100">
            <Car className="w-3.5 h-3.5 text-blue-600" />
            ≈ <strong>{carsCount.toLocaleString('fr-FR')}</strong> voitures à 100 km/h
          </div>
        )}

        {truncatedDescription && (
          <>
            <div className="border-t border-gray-200" />
            <p className="text-xs text-gray-700 leading-relaxed">
              {truncatedDescription}
            </p>
          </>
        )}

        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          {poi.project_url ? (
            <a
              href={poi.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-xs text-indigo-600 hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Site web
            </a>
          ) : <span />}

          <div className="flex items-center gap-2">
            <a href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`}>
              <Mail className="w-4 h-4 text-indigo-600" />
            </a>
            <a
              href="https://app.ekoo.co/capture"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Mic className="w-4 h-4 text-indigo-600" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPopup;