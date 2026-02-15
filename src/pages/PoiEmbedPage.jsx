import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import {
  Building,
  ExternalLink,
  Home,
  Mic,
  Mail,
  Info,
  Loader2,
  Car,
  Navigation,
  Calendar,
  Zap,
} from 'lucide-react';
import useHybridLiveData from '@/hooks/useHybridLiveData';

// Ratio voitures compactes à 100 km/h : puissance MW × 67
const CARS_PER_MW = 67;

const Divider = () => <div className="border-t border-gray-100 my-3" />;

const PoiEmbedPage = () => {
  const { poiId } = useParams();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: liveData, error: liveError, loading: liveLoading } = useHybridLiveData(poiId, 5000);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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

  const commissioningDate = poi.commissioning_date
    ? new Date(poi.commissioning_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long'
      })
    : poi.commissioning_year
    ? `${poi.commissioning_year}`
    : null;

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

  const descriptionMaxLength = 200;
  const hasLongDescription = poi.description?.length > descriptionMaxLength;
  const descriptionDisplayed = hasLongDescription && !isDescriptionExpanded
    ? poi.description.slice(0, descriptionMaxLength) + '…'
    : poi.description;

  const renderLiveValue = () => {
    if (liveError) return <span className="text-red-500 text-base">Erreur</span>;
    if (liveLoading) return <Loader2 className="w-6 h-6 animate-spin text-green-600" />;
    if (liveData?.value != null)
      return (
        <>
          <span className="text-2xl font-extrabold text-green-700">{liveData.value.toFixed(1)}</span>
          <span className="text-sm text-green-500 ml-1">{liveData.unit || 'MW'}</span>
        </>
      );
    if (poi.actual_power)
      return (
        <>
          <span className="text-2xl font-extrabold text-green-700">{poi.actual_power}</span>
          <span className="text-sm text-green-500 ml-1">{poi.actual_power_unit || 'MW'}</span>
        </>
      );
    return <span className="text-2xl font-extrabold text-gray-300">—</span>;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Barre de couleur */}
          <div className="h-3 w-full" style={{ backgroundColor: typeColor }} />

          <div className="p-6 sm:p-8">
            {/* En-tête : badge énergie (gauche) + logo client (droite) */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <span
                className="text-sm font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider text-white inline-flex items-center shadow-sm"
                style={{ backgroundColor: typeColor }}
              >
                {TypeIcon}
                {getEnergyLabel()}
              </span>
              {poi.poi_logo_url && (
                <img
                  src={poi.poi_logo_url}
                  alt={poi.name}
                  className="h-10 w-auto object-contain flex-shrink-0"
                />
              )}
            </div>

            {/* Nom du parc */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-1">
              {poi.display_name || poi.name}
            </h1>

            {/* Statut + Date inline */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {poi.status && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${getStatusColorClass(poi.status)} capitalize`}>
                  {poi.status}
                </span>
              )}
              {commissioningDate && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-400">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  {commissioningDate}
                </span>
              )}
            </div>

            <Divider />

            {/* Localisation */}
            <div className="space-y-1.5 mb-1">
              <div className="flex items-center text-base text-gray-600 gap-1.5">
                <Building className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span>
                  {poi.city && (
                    <Link to={`/map?city=${encodeURIComponent(poi.city)}`} className="hover:text-indigo-600 hover:underline font-medium">
                      {poi.city}
                    </Link>
                  )}
                  {poi.city && poi.region && ' · '}
                  {poi.region && (
                    <Link to={`/map?region=${encodeURIComponent(poi.region)}`} className="hover:text-indigo-600 hover:underline">
                      {poi.region}
                    </Link>
                  )}
                  {!poi.city && !poi.region && 'Localisation non spécifiée'}
                </span>
              </div>
              {poi.intercommunalites?.length > 0 && (
                <div className="text-sm text-gray-400 pl-5.5 truncate">
                  {poi.intercommunalites.map((interco, i) => (
                    <span key={interco}>
                      <Link to={`/map?intercommunalite=${encodeURIComponent(interco)}`} className="hover:text-indigo-600 hover:underline">
                        {interco}
                      </Link>
                      {i < poi.intercommunalites.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
              {poi.latitude != null && poi.longitude != null && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium pl-5"
                >
                  <Navigation className="w-4 h-4 flex-shrink-0" />
                  Itinéraire
                </a>
              )}
            </div>

            <Divider />

            {/* ---- CARDS DATA : grid 2 colonnes (comme le popup) ---- */}
            <div className="grid grid-cols-2 gap-3">
              {/* Card Capacité */}
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">Capacité</div>
                {poi.nominal_power ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-gray-800">{poi.nominal_power}</span>
                    <span className="text-sm text-gray-400">{poi.nominal_power_unit || 'MW'}</span>
                  </div>
                ) : (
                  <span className="text-2xl font-extrabold text-gray-300">—</span>
                )}
              </div>

              {/* Card Production live */}
              <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs uppercase tracking-wide text-gray-500">Temps réel</span>
                  {liveData?.value != null && (
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-baseline gap-0.5">
                  {renderLiveValue()}
                </div>
              </div>
            </div>

            {/* Cards équivalences : foyers (gauche) + voitures (droite, sous temps réel) */}
            {(carsCount != null || poi.households_equivalent) && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {poi.households_equivalent && (
                  <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100 text-center">
                    <Home className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-amber-700">{poi.households_equivalent.toLocaleString('fr-FR')}</div>
                    <div className="text-xs text-amber-400">foyers</div>
                  </div>
                )}
                {carsCount != null && (
                  <div className={`bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 text-center${poi.households_equivalent ? '' : ' col-start-2'}`}>
                    <Car className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                    <div className="text-lg font-bold text-blue-700">= {carsCount.toLocaleString('fr-FR')}</div>
                    <div className="text-xs text-blue-400">voitures roulant</div>
                    <div className="text-[10px] text-blue-300">a 100 km/h (conso. elec.)</div>
                  </div>
                )}
              </div>
            )}

            {/* Production annuelle */}
            {poi.annual_production_mwh && (
              <div className="bg-indigo-50 rounded-xl px-4 py-3 border border-indigo-100 text-center mt-3">
                <Zap className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <div className="text-lg font-bold text-indigo-700">{poi.annual_production_mwh.toLocaleString('fr-FR')}</div>
                <div className="text-xs text-indigo-400">MWh/an</div>
              </div>
            )}

            {/* Description */}
            {poi.description && (
              <>
                <Divider />
                <div>
                  <p className="text-base text-gray-600 leading-relaxed">
                    {descriptionDisplayed}
                  </p>
                  {hasLongDescription && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline mt-2 font-medium"
                    >
                      {isDescriptionExpanded ? 'Lire moins' : 'Lire plus'}
                    </button>
                  )}
                </div>
              </>
            )}

            <Divider />

            {/* Lien site web */}
            {poi.project_url && (
              <a
                href={poi.project_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-base text-indigo-600 hover:text-indigo-800 font-medium mb-3"
              >
                <ExternalLink className="w-4 h-4" />
                Site web
              </a>
            )}

            {/* Signalement (mail + micro) */}
            {(poi.show_email_report !== false || poi.show_voice_report !== false) && (
              <div className="flex items-center gap-3 text-base text-gray-600 mb-3">
                <span className="text-gray-500">Signalement ?</span>
                {poi.show_email_report !== false && (
                  <a
                    href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`}
                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    title="Par email"
                  >
                    <Mail className="w-6 h-6" />
                  </a>
                )}
                {poi.show_voice_report !== false && (
                  <a
                    href={poi.voice_report_url || "https://app.ekoo.co/capture"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 transition-colors"
                    title="Par vocal"
                  >
                    <Mic className="w-6 h-6" />
                  </a>
                )}
              </div>
            )}

            {/* Newsletter */}
            {poi.show_newsletter !== false && (
              <a
                href={poi.newsletter_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base text-indigo-600 hover:text-indigo-800 transition-colors mb-3"
              >
                <Info className="w-6 h-6 flex-shrink-0" />
                <span>L'actu du parc par email</span>
              </a>
            )}

            {/* Propulsé par Quelia */}
            <a
              href="https://quelia.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-sm text-gray-400 hover:text-indigo-500 transition-colors pt-3 mt-1 border-t border-gray-100"
            >
              Propulsé par <span className="font-semibold ml-1 text-gray-600">Quelia</span>
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PoiEmbedPage;
