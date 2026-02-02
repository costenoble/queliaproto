
import React from 'react';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, calculateEquivalent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { Calendar, Zap, MapPin, Building, User, ExternalLink, Home, Map as MapIcon, Loader2 } from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

const ProjectPopup = ({ poi }) => {
  if (!poi) return null;

  const statusClass = getStatusColorClass(poi.status);
  // Use energy_category for color, fallback to legacy type
  const energyType = poi.energy_category || poi.type;
  const typeColor = getMarkerColor(energyType);
  const TypeIcon = getMarkerIconComponent(energyType, "w-4 h-4 mr-1");

  // Fetch live data (PUSH depuis live_data OU PULL depuis live_data_url)
  const { data: liveData, error: liveError, loading: liveLoading, source } = useHybridLiveData(
    poi.id,
    5000 // Refresh every 5 seconds
  );

  // Get display label for energy type
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

  // Calculate equivalent if power data exists
  const equivalent = calculateEquivalent(
    poi.nominal_power,
    poi.nominal_power_unit,
    poi.equivalent_display || 'foyers'
  );

  // Format communes display
  const communesDisplay = poi.communes?.length > 0
    ? poi.communes.slice(0, 3).join(', ') + (poi.communes.length > 3 ? ` +${poi.communes.length - 3}` : '')
    : null;

  return (
    <div className="w-80 bg-white overflow-hidden font-sans rounded-lg shadow-sm">
      {/* Header with color bar */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: typeColor }}
      ></div>

      <div className="p-5">
        {/* Energy type badge */}
        <div className="flex justify-between items-start mb-3">
          <span
            className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider text-white flex items-center shadow-sm"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            {getEnergyLabel()}
          </span>
        </div>

        {/* POI Logo if exists */}
        {poi.poi_logo_url && (
          <div className="mb-3">
            <img
              src={poi.poi_logo_url}
              alt={poi.name}
              className="h-12 w-auto object-contain"
            />
          </div>
        )}

        {/* Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
          {poi.display_name || poi.name}
        </h3>

        {/* Operator */}
        {poi.operator && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <User className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            {poi.operator}
          </div>
        )}

        {/* Location info */}
        <div className="flex flex-col gap-1.5 mb-4">
          {/* City/Region */}
          <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full w-fit">
            <Building className="w-3 h-3 mr-1" />
            {poi.city || 'Localisation non spécifiée'}
            {poi.region && <span className="ml-1 text-gray-400">• {poi.region}</span>}
          </div>

          {/* Communes */}
          {communesDisplay && (
            <div className="flex items-center text-xs text-gray-500 px-1">
              <Home className="w-3 h-3 mr-1 text-gray-400" />
              {communesDisplay}
            </div>
          )}

          {/* Address */}
          {poi.address && (
            <div className="flex items-start text-xs text-gray-600 px-1 mt-1">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5 text-gray-400" />
              <span className="leading-snug">{poi.address}</span>
            </div>
          )}

          {/* Status */}
          {poi.status && (
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusClass} capitalize w-fit`}>
                {poi.status}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {poi.description && (
          <p className="text-sm text-gray-600 mb-4 leading-relaxed border-t border-b border-gray-100 py-3">
            {poi.description}
          </p>
        )}

        {/* Power & Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Nominal Power */}
          {poi.nominal_power && (
            <div className="flex items-start text-gray-700">
              <Zap className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-500">Puissance nominale</span>
                <span className="font-semibold">{poi.nominal_power} {poi.nominal_power_unit || 'MW'}</span>
              </div>
            </div>
          )}

          {/* Actual Power (statique) */}
          {poi.actual_power && !liveData && (
            <div className="flex items-start text-gray-700">
              <Zap className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-500">Puissance en direct</span>
                <span className="font-semibold text-green-600">{poi.actual_power} {poi.actual_power_unit || 'MW'}</span>
              </div>
            </div>
          )}

          {/* Live Data - Temps réel (PUSH ou PULL) */}
          {(liveData || liveLoading || poi.live_data_url) && (
            <div className="flex items-start text-gray-700">
              <Zap className="w-4 h-4 mr-2 text-green-500 mt-0.5 animate-pulse" />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="block text-xs text-gray-500">Temps réel</span>
                  {source && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-medium">
                      {source === 'push' ? 'PUSH' : 'PULL'}
                    </span>
                  )}
                </div>
                {liveError ? (
                  <span className="text-xs text-red-600">Erreur</span>
                ) : liveLoading ? (
                  <div className="flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-green-600" />
                    <span className="text-xs text-gray-400">...</span>
                  </div>
                ) : liveData?.value !== null && liveData?.value !== undefined ? (
                  <span className="font-semibold text-green-600">
                    {typeof liveData.value === 'number' ? liveData.value.toFixed(2) : liveData.value} {liveData.unit || 'kW'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">---</span>
                )}
              </div>
            </div>
          )}

          {/* Commissioning Year */}
          {poi.commissioning_year && (
            <div className="flex items-start text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-500">Mise en service</span>
                <span className="font-semibold">{poi.commissioning_year}</span>
              </div>
            </div>
          )}

          {/* Equivalent */}
          {equivalent && (
            <div className="flex items-start text-gray-700">
              <MapIcon className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-500">Équivalent</span>
                <span className="font-semibold">{equivalent.value}</span>
                <span className="block text-xs text-gray-400">{equivalent.label}</span>
              </div>
            </div>
          )}
        </div>

        {/* Website Link */}
        {poi.project_url && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <a
              href={poi.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <ExternalLink className="w-4 h-4 mr-1.5" />
              Voir le site web
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPopup;
