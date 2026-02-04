
import React from 'react';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { Building, ExternalLink, Home, Mic, Mail, Loader2, Car } from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

// Ratio : 10.12 MW = 264 voitures à 80 km/h
const CARS_PER_MW = 264 / 10.12;

const ProjectPopup = ({ poi }) => {
  if (!poi) return null;

  const energyType = poi.energy_category || poi.type;
  const typeColor = getMarkerColor(energyType);
  const TypeIcon = getMarkerIconComponent(energyType, "w-4 h-4 mr-1");

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

  // Terrestre / Maritime selon le sous-type
  const terrainLabel = poi.energy_subtype?.toLowerCase().includes('off shore') ? 'Maritime' : 'Terrestre';

  // Parties de localisation
  const locationParts = [poi.city, poi.region].filter(Boolean);

  // Puissance nominale convertie en MW pour le calcul voitures
  const nominalPowerMW = poi.nominal_power
    ? (poi.nominal_power_unit === 'kW' ? poi.nominal_power / 1000 : poi.nominal_power)
    : null;

  const carsCount = nominalPowerMW ? Math.round(nominalPowerMW * CARS_PER_MW) : null;

  return (
    <div className="w-80 bg-white overflow-hidden font-sans rounded-lg shadow-sm">
      {/* Barre de couleur */}
      <div className="h-2 w-full" style={{ backgroundColor: typeColor }}></div>

      <div className="p-5">
        {/* Badge type d'énergie (gauche) + Logo (haut à droite) */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="inline-flex items-center text-xs font-bold px-2 py-1 rounded uppercase tracking-wider text-white shadow-sm"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            {getEnergyLabel()}
          </span>
          {poi.poi_logo_url && (
            <img
              src={poi.poi_logo_url}
              alt={poi.name}
              className="h-14 w-auto object-contain rounded-lg border border-gray-100 shadow-sm flex-shrink-0"
            />
          )}
        </div>

        {/* Nom du parc */}
        <h3 className="text-xl font-bold text-gray-900 leading-tight">
          {poi.display_name || poi.name}
        </h3>

        {/* Terrestre / Maritime + Statut */}
        <div className="flex items-center gap-2 mb-3 mt-0.5">
          <span className="text-sm text-gray-500">{terrainLabel}</span>
          {poi.status && (
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColorClass(poi.status)} capitalize`}>
              {poi.status}
            </span>
          )}
        </div>

        {/* Ville / Agglomération */}
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Building className="w-3.5 h-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
            <span>{locationParts.join(' • ') || 'Localisation non spécifiée'}</span>
          </div>
          {poi.intercommunalites?.length > 0 && (
            <div className="text-xs text-gray-500 mt-0.5 pl-5">
              {poi.intercommunalites.slice(0, 2).join(', ')}{poi.intercommunalites.length > 2 ? ` +${poi.intercommunalites.length - 2}` : ''}
            </div>
          )}
          {poi.communes?.length > 0 && (
            <div className="flex items-center text-xs text-gray-500 mt-0.5 pl-4">
              <Home className="w-3 h-3 mr-1 text-gray-400" />
              {poi.communes.slice(0, 3).join(', ')}{poi.communes.length > 3 ? ` +${poi.communes.length - 3}` : ''}
            </div>
          )}
        </div>

        {/* Puissance : Capacité nominale (gauche) | Production temps réel (droite) */}
        <div className="grid grid-cols-2 gap-4 mb-1">
          <div>
            <span className="block text-xs text-gray-500 mb-0.5">Capacité nominale</span>
            {poi.nominal_power ? (
              <span className="font-semibold text-gray-900">{poi.nominal_power} {poi.nominal_power_unit || 'MW'}</span>
            ) : (
              <span className="text-sm text-gray-400">---</span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-xs text-gray-500">Production temps réel</span>
              {source && (
                <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-medium">
                  {source === 'push' ? 'PUSH' : 'PULL'}
                </span>
              )}
            </div>
            {liveError ? (
              <span className="text-xs text-red-600">Erreur</span>
            ) : liveLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
            ) : liveData?.value !== null && liveData?.value !== undefined ? (
              <span className="font-semibold text-green-600">
                {typeof liveData.value === 'number' ? liveData.value.toFixed(2) : liveData.value} {liveData.unit || 'MW'}
              </span>
            ) : poi.actual_power ? (
              <span className="font-semibold text-green-600">{poi.actual_power} {poi.actual_power_unit || 'MW'}</span>
            ) : (
              <span className="text-sm text-gray-400">---</span>
            )}
          </div>
        </div>

        {/* Équivalent voitures à 80 km/h — aligné à droite */}
        {carsCount !== null && (
          <div className="flex justify-end mb-3">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-gray-600" />
              <span className="font-semibold text-gray-700">{carsCount.toLocaleString('fr-FR')}</span> voitures à 80 km/h
            </span>
          </div>
        )}

        {/* Description */}
        {poi.description && (
          <p className="text-sm text-gray-600 leading-relaxed border-t border-b border-gray-100 py-3 mb-3">
            {poi.description}
          </p>
        )}

        {/* Lien site web */}
        {poi.project_url && (
          <div className="mb-3">
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

        {/* Contact + Mailing + Propulsé par Quelia */}
        <div className="border-t border-gray-100 pt-3 mt-2 space-y-2">
          <a
            href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`}
            className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>Faites-nous le savoir par mail</span>
          </a>
          <a
            href="https://app.ekoo.co/capture?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJvcmdfaWRdCI6MTcyNzI3ODAxOX0.D3j-mGrgBYl-HW4rBBQid-E-q9sQonuboWXb9eZzuvA"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <Mic className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
            <span>Faites-nous le savoir par vocal</span>
          </a>
          <a
            href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors pt-2 border-t border-gray-100"
          >
            <span>Vous voulez des infos ? <span className="font-semibold underline">Inscrivez votre email</span> à la liste de diffusion</span>
          </a>
          <a
            href="https://quelia.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center text-xs text-gray-400 hover:text-indigo-500 transition-colors pt-2 border-t border-gray-100"
          >
            Propulsé par <span className="font-semibold ml-1 text-gray-600">Quelia</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProjectPopup;
