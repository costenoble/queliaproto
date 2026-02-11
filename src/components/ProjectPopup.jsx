import React from 'react';
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
  Info,
  Loader2,
  Car,
  Navigation,
  Calendar,
  Zap,
  Leaf,
  Home,
} from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

const CARS_PER_MW = 67;

const Divider = () => <div className="border-t border-gray-100 my-2" />;

const ProjectPopup = ({ poi, onSelectCity, onSelectRegion }) => {
  const { data: liveData, error: liveError, loading: liveLoading } =
    useHybridLiveData(poi?.id, 5000);

  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

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

  // Calcul automatique du CO2 évité si non renseigné
  const calculateCO2Avoided = () => {
    if (!poi.nominal_power) return null;

    const powerMW = poi.nominal_power_unit === 'kW'
      ? poi.nominal_power / 1000
      : poi.nominal_power;

    // Facteurs de charge typiques par type d'énergie
    const loadFactors = {
      'éolien_onshore': 0.25,
      'éolien_offshore': 0.40,
      'solaire': 0.14,
      'hydroélectricité': 0.45,
      'biométhane': 0.85,
      'méthanisation': 0.85,
      'cogénération': 0.70,
    };

    let loadFactor = 0.25; // par défaut éolien onshore

    const energyTypeLower = energyType?.toLowerCase() || '';

    if (energyTypeLower.includes('éolien')) {
      loadFactor = energyTypeLower.includes('off shore') || energyTypeLower.includes('offshore')
        ? loadFactors.éolien_offshore
        : loadFactors.éolien_onshore;
    } else if (energyTypeLower.includes('solaire')) {
      loadFactor = loadFactors.solaire;
    } else if (energyTypeLower.includes('hydro')) {
      loadFactor = loadFactors.hydroélectricité;
    } else if (energyTypeLower.includes('biométhane') || energyTypeLower.includes('méthanisation')) {
      loadFactor = loadFactors.méthanisation;
    } else if (energyTypeLower.includes('cogénération')) {
      loadFactor = loadFactors.cogénération;
    }

    // Calcul : Puissance (MW) × 8760 h/an × Facteur de charge × Émissions évitées (0.35 t CO2/MWh)
    const co2Avoided = powerMW * 8760 * loadFactor * 0.35;

    return Math.round(co2Avoided);
  };

  const co2AvoidedTons = poi.co2_avoided_tons || calculateCO2Avoided();

  // Gestion de la description avec "Lire plus"
  const descriptionMaxLength = 120;
  const hasLongDescription = poi.description?.length > descriptionMaxLength;
  const displayedDescription = hasLongDescription && !isDescriptionExpanded
    ? poi.description.slice(0, descriptionMaxLength) + '…'
    : poi.description;

  // Formatage de la date/année de mise en exploitation
  const commissioningDate = poi.commissioning_date
    ? new Date(poi.commissioning_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long'
      })
    : poi.commissioning_year
    ? `${poi.commissioning_year}`
    : null;

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

        {/* ---- Statut ---- */}
        {poi.status && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span
              className={`text-[10px] px-1.5 py-px rounded-full border font-medium leading-none ${getStatusColorClass(poi.status)}`}
            >
              {poi.status}
            </span>
          </div>
        )}

        {/* Date de mise en exploitation */}
        {commissioningDate && (
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>Mise en service : {commissioningDate}</span>
          </div>
        )}

        <Divider />

        {/* ---- Localisation ---- */}
        <div className="flex items-center text-xs text-gray-600 gap-1">
          <Building className="w-3 h-3 flex-shrink-0 text-gray-400" />
          <span className="truncate">
            {poi.city ? (
              <button
                onClick={() => onSelectCity?.(poi.city)}
                className="hover:underline hover:text-indigo-600 font-medium cursor-pointer"
              >
                {poi.city}
              </button>
            ) : null}
            {poi.city && poi.region ? ' · ' : null}
            {poi.region ? (
              <button
                onClick={() => onSelectRegion?.(poi.region)}
                className="hover:underline hover:text-indigo-600 cursor-pointer"
              >
                {poi.region}
              </button>
            ) : null}
            {!poi.city && !poi.region ? 'Non spécifiée' : null}
          </span>
        </div>

        {poi.lat != null && poi.lng != null && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
          >
            <Navigation className="w-3 h-3 flex-shrink-0" />
            Itinéraire
          </a>
        )}

        <Divider />

        {/* ---- Puissance : nominale + temps réel + voitures ---- */}
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

          {/* Temps réel + voitures en dessous */}
          <div className="space-y-2">
            <div className="bg-green-50 rounded-md px-2.5 py-2 border border-green-200">
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[10px] text-gray-500 leading-none">Production en temps réel</span>
                {liveData?.value != null && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-green-700 leading-none">
                {renderLivePower()}
              </div>
            </div>

            {carsCount != null && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] bg-blue-50 rounded-md py-1.5 border border-blue-100 text-blue-700">
                <Car className="w-4 h-4 flex-shrink-0" />
                <span>= <strong>{carsCount.toLocaleString('fr-FR')}</strong> voitures</span>
              </div>
            )}
          </div>
        </div>

        {/* ---- Foyers alimentés ---- */}
        {poi.households_equivalent && (
          <div className="flex items-center justify-center gap-1.5 text-[11px] bg-amber-50 rounded-md py-1.5 border border-amber-100 text-amber-700">
            <Home className="w-4 h-4 flex-shrink-0" />
            <span>≈ <strong>{poi.households_equivalent.toLocaleString('fr-FR')}</strong> foyers</span>
          </div>
        )}

        {/* ---- Impact environnemental ---- */}
        {(poi.annual_production_mwh || co2AvoidedTons) && (
          <>
            <Divider />
            <div className="space-y-1.5">
              {poi.annual_production_mwh && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
                  <Zap className="w-3 h-3 flex-shrink-0 text-indigo-500" />
                  <span>Productible annuel : <strong>{poi.annual_production_mwh.toLocaleString('fr-FR')} MWh/an</strong></span>
                </div>
              )}
              {co2AvoidedTons && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
                  <Leaf className="w-3 h-3 flex-shrink-0 text-green-500" />
                  <span>CO₂ évité : <strong>{co2AvoidedTons.toLocaleString('fr-FR')} tonnes/an</strong>{!poi.co2_avoided_tons && ' (estimé)'}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* ---- Description ---- */}
        {displayedDescription && (
          <>
            <Divider />
            <div>
              <p className="text-xs text-gray-600 leading-relaxed">{displayedDescription}</p>
              {hasLongDescription && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline mt-1 font-medium"
                >
                  {isDescriptionExpanded ? 'Lire moins' : 'Lire plus'}
                </button>
              )}
            </div>
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

        {/* Signalement + Liste de diffusion (conditionnel) */}
        {(poi.show_email_report !== false || poi.show_voice_report !== false || poi.show_newsletter !== false) && (
          <div className="flex items-center gap-3 text-xs text-gray-600">
            {(poi.show_email_report !== false || poi.show_voice_report !== false) && (
              <span className="text-gray-500">Signalement ?</span>
            )}
            {poi.show_email_report !== false && (
              <a href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`} title="Par email">
                <Mail className="w-5 h-5 text-indigo-600 hover:text-indigo-800" />
              </a>
            )}
            {poi.show_voice_report !== false && (
              <a
                href="https://app.ekoo.co/capture"
                target="_blank"
                rel="noopener noreferrer"
                title="Par vocal"
              >
                <Mic className="w-5 h-5 text-indigo-600 hover:text-indigo-800" />
              </a>
            )}
            {poi.show_newsletter !== false && (
              <a
                href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
                target="_blank"
                rel="noopener noreferrer"
                title="L'actu du parc par email"
              >
                <Info className="w-5 h-5 text-indigo-600 hover:text-indigo-800" />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPopup;