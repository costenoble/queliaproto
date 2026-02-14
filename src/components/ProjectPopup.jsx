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

  /* ---- Rendu live power (valeur + unité séparés) ---- */
  const renderLiveValue = () => {
    if (liveError) return <span className="text-red-500 text-sm">Erreur</span>;
    if (liveLoading) return <Loader2 className="w-5 h-5 animate-spin text-green-600" />;
    if (liveData?.value != null)
      return (
        <>
          <span className="text-lg font-extrabold text-green-700">{liveData.value.toFixed(1)}</span>
          <span className="text-[10px] text-green-500 ml-0.5">{liveData.unit || 'MW'}</span>
        </>
      );
    if (poi.actual_power)
      return (
        <>
          <span className="text-lg font-extrabold text-green-700">{poi.actual_power}</span>
          <span className="text-[10px] text-green-500 ml-0.5">{poi.actual_power_unit || 'MW'}</span>
        </>
      );
    return <span className="text-lg font-extrabold text-gray-300">—</span>;
  };

  /* ============================================================== */
  return (
    <div className="min-w-0 max-w-[340px] text-sm font-sans">
      {/* Barre couleur haute */}
      <div className="h-1.5 w-full -mt-[1px] rounded-t" style={{ backgroundColor: typeColor }} />

      <div className="px-3 pt-3 pb-2.5 space-y-2.5">
        {/* ---- En-tête : logo client + badge énergie ---- */}
        {poi.poi_logo_url && (
          <div className="flex justify-center mb-1">
            <img
              src={poi.poi_logo_url}
              alt={poi.name}
              className="h-10 w-auto object-contain"
            />
          </div>
        )}
        <div className="flex items-start min-w-0">
          <span
            className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide text-white flex-shrink min-w-0"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            <span className="truncate">{energyLabel}</span>
          </span>
        </div>

        {/* ---- Titre ---- */}
        <h3 className="text-base font-extrabold text-gray-900 leading-tight">
          {poi.display_name || poi.name}
        </h3>

        {/* ---- Statut + Date inline ---- */}
        <div className="flex items-center gap-2 flex-wrap">
          {poi.status && (
            <span
              className={`text-[10px] px-1.5 py-px rounded-full border font-medium leading-none ${getStatusColorClass(poi.status)}`}
            >
              {poi.status}
            </span>
          )}
          {commissioningDate && (
            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Calendar className="w-3 h-3 flex-shrink-0" />
              {commissioningDate}
            </span>
          )}
        </div>

        <Divider />

        {/* ---- Localisation ---- */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center text-xs text-gray-600 gap-1 min-w-0">
            <Building className="w-3 h-3 flex-shrink-0 text-gray-400" />
            <span className="truncate min-w-0">
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
          {poi.intercommunalites && (
            <div className="text-[11px] text-gray-400 pl-4 truncate">
              {Array.isArray(poi.intercommunalites)
                ? poi.intercommunalites.join(', ')
                : poi.intercommunalites}
            </div>
          )}
          {poi.lat != null && poi.lng != null && (
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${poi.lat},${poi.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-medium pl-4"
            >
              <Navigation className="w-3 h-3 flex-shrink-0" />
              Itinéraire
            </a>
          )}
        </div>

        <Divider />

        {/* ---- CARDS DATA : grid 2 colonnes ---- */}
        <div className="grid grid-cols-2 gap-2 min-w-0">
          {/* Card Capacité */}
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 min-w-0">
            <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Capacité</div>
            {poi.nominal_power ? (
              <div className="flex items-baseline gap-0.5">
                <span className="text-lg font-extrabold text-gray-800">{poi.nominal_power}</span>
                <span className="text-[10px] text-gray-400">{poi.nominal_power_unit || 'MW'}</span>
              </div>
            ) : (
              <span className="text-lg font-extrabold text-gray-300">—</span>
            )}
          </div>

          {/* Card Production live */}
          <div className="bg-green-50 rounded-lg px-3 py-2.5 border border-green-200 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] uppercase tracking-wide text-gray-500">Temps réel</span>
              {liveData?.value != null && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-0.5">
              {renderLiveValue()}
            </div>
          </div>
        </div>

        {/* ---- Cards équivalences : voitures + foyers côte à côte ---- */}
        {(carsCount != null || poi.households_equivalent) && (
          <div className="grid grid-cols-2 gap-2 min-w-0">
            {carsCount != null && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 border border-blue-100 min-w-0 text-center">
                <Car className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                <div className="text-sm font-bold text-blue-700">= {carsCount.toLocaleString('fr-FR')}</div>
                <div className="text-[9px] text-blue-400">voitures roulant</div>
                <div className="text-[8px] text-blue-300">a 100 km/h (conso. elec.)</div>
              </div>
            )}
            {poi.households_equivalent && (
              <div className="bg-amber-50 rounded-lg px-3 py-2 border border-amber-100 min-w-0 text-center">
                <Home className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
                <div className="text-sm font-bold text-amber-700">{poi.households_equivalent.toLocaleString('fr-FR')}</div>
                <div className="text-[9px] text-amber-400">foyers</div>
              </div>
            )}
          </div>
        )}

        {/* ---- Production annuelle ---- */}
        {poi.annual_production_mwh && (
          <div className="bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100 min-w-0 text-center">
            <Zap className="w-4 h-4 text-indigo-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-indigo-700">{poi.annual_production_mwh.toLocaleString('fr-FR')}</div>
            <div className="text-[9px] text-indigo-400">MWh/an</div>
          </div>
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

        {/* Signalement (mail + micro) */}
        {(poi.show_email_report !== false || poi.show_voice_report !== false) && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="text-gray-500">Signalement ?</span>
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
          </div>
        )}

        {/* Newsletter — séparée du signalement */}
        {poi.show_newsletter !== false && (
          <a
            href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800"
          >
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>L'actu du parc par email</span>
          </a>
        )}

      </div>
    </div>
  );
};

export default ProjectPopup;