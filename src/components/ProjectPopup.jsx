import React from 'react';
import { Link } from 'react-router-dom';
import {
  getStatusColorClass,
  getMarkerColor,
  getMarkerIconComponent,
  ENERGY_CATEGORIES,
} from '@/utils/mapUtils.jsx';
import {
  Building,
  ExternalLink,
  Mic,
  Mail,
  Loader2,
  Car,
  MapPin,
} from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

const CARS_PER_MW = 67;

const Divider = () => <div className="border-t border-gray-100 my-2" />;

const ProjectPopup = ({ poi }) => {
  const { data: liveData, error: liveError, loading: liveLoading, source } =
    useHybridLiveData(poi?.id, 5000);

  if (!poi) return null;

  /* ---- Données dérivées ---- */
  const energyType = poi.energy_category || poi.type;
  const typeColor = getMarkerColor(energyType);
  const TypeIcon = getMarkerIconComponent(energyType, 'w-3 h-3 mr-1');

  const energyLabel = (() => {
    if (poi.energy_category) {
      const cat = ENERGY_CATEGORIES[poi.energy_category];
      const label = cat?.label || poi.energy_category;
      return poi.energy_subtype ? `${label} – ${poi.energy_subtype}` : label;
    }
    return poi.type || 'Énergie';
  })();

  const terrainLabel = poi.energy_subtype?.toLowerCase().includes('off shore')
    ? 'Maritime'
    : 'Terrestre';

  const livePowerMW = (() => {
    if (liveData?.value != null)
      return liveData.unit === 'kW' ? liveData.value / 1000 : liveData.value;
    if (poi.actual_power)
      return poi.actual_power_unit === 'kW'
        ? poi.actual_power / 1000
        : poi.actual_power;
    return null;
  })();

  const carsCount = livePowerMW ? Math.round(livePowerMW * CARS_PER_MW) : null;

  const description =
    poi.description?.length > 120
      ? poi.description.slice(0, 120) + '…'
      : poi.description;

  /* ---- Rendu live power ---- */
  const renderLivePower = () => {
    if (liveError) return 'Erreur';
    if (liveLoading) return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    if (liveData?.value != null)
      return `${liveData.value.toFixed(1)} ${liveData.unit || 'MW'}`;
    if (poi.actual_power)
      return `${poi.actual_power} ${poi.actual_power_unit || 'MW'}`;
    return '—';
  };

  /* ============================================================== */
  return (
    <div className="min-w-[260px] max-w-[340px] text-sm font-sans">
      {/* Barre couleur haute */}
      <div className="h-1 w-full -mt-[1px] rounded-t" style={{ backgroundColor: typeColor }} />

      <div className="px-3 pt-3 pb-2 space-y-2">
        {/* ---- En-tête : badge + logo ---- */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide text-white"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            {energyLabel}
          </span>

          {poi.poi_logo_url && (
            <img
              src={poi.poi_logo_url}
              alt={poi.name}
              className="h-8 w-auto object-contain flex-shrink-0"
            />
          )}
        </div>

        {/* ---- Titre ---- */}
        <h3 className="text-[15px] font-bold text-gray-900 leading-tight">
          {poi.display_name || poi.name}
        </h3>

        {/* ---- Terrain + Statut ---- */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>{terrainLabel}</span>
          {poi.status && (
            <span
              className={`text-[10px] px-1.5 py-px rounded-full border font-medium leading-none ${getStatusColorClass(poi.status)}`}
            >
              {poi.status}
            </span>
          )}
        </div>

        <Divider />

        {/* ---- Localisation ---- */}
        <div className="flex items-center text-xs text-gray-600 gap-1">
          <Building className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className="truncate">
            {poi.city ? (
              <Link
                to={`/map?city=${encodeURIComponent(poi.city)}`}
                className="hover:underline hover:text-indigo-600 font-medium"
              >
                {poi.city}
              </Link>
            ) : null}
            {poi.city && poi.region ? ' · ' : null}
            {poi.region ? (
              <Link
                to={`/map?region=${encodeURIComponent(poi.region)}`}
                className="hover:underline hover:text-indigo-600"
              >
                {poi.region}
              </Link>
            ) : null}
            {!poi.city && !poi.region ? 'Non spécifiée' : null}
          </span>
        </div>

        {poi.lat != null && poi.lng != null && (
          <a
            href={`https://www.google.com/maps?q=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-indigo-600"
          >
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
          </a>
        )}

        <Divider />

        {/* ---- Puissance : nominale + temps réel ---- */}
        <div className="grid grid-cols-2 gap-2">
          {/* Nominale */}
          <div className="bg-gray-50 rounded-md px-2.5 py-2">
            <div className="text-[10px] text-gray-400 leading-none mb-1">Capacité</div>
            <div className="text-sm font-bold text-gray-800 leading-none">
              {poi.nominal_power
                ? `${poi.nominal_power} ${poi.nominal_power_unit || 'MW'}`
                : '—'}
            </div>
          </div>

          {/* Temps réel */}
          <div className="bg-green-50 rounded-md px-2.5 py-2 border border-green-200">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] text-gray-500 leading-none">Temps réel</span>
              {liveData?.value != null && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
              )}
              {source && (
                <span className="text-[7px] bg-green-600 text-white px-0.5 rounded leading-none">
                  {source.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-sm font-bold text-green-700 leading-none">
              {renderLivePower()}
            </div>
          </div>
        </div>

        {/* ---- Équivalent voitures ---- */}
        {carsCount != null && (
          <div className="flex items-center justify-center gap-1 text-[11px] bg-blue-50 rounded-md py-1.5 border border-blue-100 text-blue-700">
            <Car className="w-3 h-3 flex-shrink-0" />
            ≈ <strong>{carsCount.toLocaleString('fr-FR')}</strong> voitures à 100 km/h
          </div>
        )}

        {/* ---- Description ---- */}
        {description && (
          <>
            <Divider />
            <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
          </>
        )}

        {/* ---- Footer ---- */}
        <Divider />

        {/* Site web */}
        {poi.project_url && (
          <a
            href={poi.project_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            Site web
          </a>
        )}

        {/* Signalement */}
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <span>Signalement ?</span>
          <a href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`} title="Par email">
            <Mail className="w-3.5 h-3.5 text-indigo-600 hover:text-indigo-800" />
          </a>
          <a
            href="https://app.ekoo.co/capture"
            target="_blank"
            rel="noopener noreferrer"
            title="Par vocal"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-600 hover:text-indigo-800" />
          </a>
        </div>

        {/* Liste de diffusion */}
        <a
          href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-600 hover:underline"
        >
          Liste de diffusion ? votre mail
        </a>
      </div>
    </div>
  );
};

export default ProjectPopup;