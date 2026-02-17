import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
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
  Leaf,
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
      if (poi.energy_subtype) {
        const subtypeLabel = category?.subtypes?.find(s => s.value === poi.energy_subtype)?.label || poi.energy_subtype;
        return `${categoryLabel} - ${subtypeLabel}`;
      }
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
            <div className="space-y-1 mb-1">
              {/* Ligne 1 : Commune · Intercommunalité */}
              <div className="flex items-center text-base text-gray-600 gap-1.5">
                <Building className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span>
                  {poi.city && (
                    <Link to={`/?city=${encodeURIComponent(poi.city)}`} className="hover:text-indigo-600 hover:underline font-medium">
                      {poi.city}
                    </Link>
                  )}
                  {poi.city && poi.intercommunalites?.length > 0 && ' · '}
                  {poi.intercommunalites?.length > 0 && (
                    poi.intercommunalites.map((interco, i) => (
                      <span key={interco}>
                        <Link to={`/?intercommunalite=${encodeURIComponent(interco)}`} className="hover:text-indigo-600 hover:underline">
                          {interco}
                        </Link>
                        {i < poi.intercommunalites.length - 1 && ', '}
                      </span>
                    ))
                  )}
                  {!poi.city && !poi.intercommunalites?.length && 'Localisation non spécifiée'}
                </span>
              </div>
              {/* Ligne 2 : Région (plus petit) */}
              {poi.region && (
                <div className="text-sm text-gray-400 pl-5.5">
                  <Link to={`/?region=${encodeURIComponent(poi.region)}`} className="hover:text-indigo-600 hover:underline">
                    {poi.region}
                  </Link>
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

            {/* ---- Ligne 1 : Capacité + CO2 ---- */}
            {(poi.show_capacity !== false || (poi.co2_avoided_tons && poi.show_co2 !== false)) && (
              <div className="grid grid-cols-2 gap-3">
                {poi.show_capacity !== false && (
                  <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col justify-center h-[88px]">
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
                )}
                {poi.co2_avoided_tons && poi.show_co2 !== false && (
                  <div className="bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100 flex flex-col items-center justify-center h-[88px]">
                    <Leaf className="w-5 h-5 text-emerald-500 mb-1" />
                    <div className="text-lg font-bold text-emerald-700">{Number(poi.co2_avoided_tons).toLocaleString('fr-FR')}</div>
                    <div className="text-xs text-emerald-400">tonnes CO2/an évitées</div>
                  </div>
                )}
              </div>
            )}

            {/* ---- Ligne 2 : Temps réel + Voitures ---- */}
            {(poi.show_realtime !== false || (carsCount != null && poi.show_cars !== false)) && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                {poi.show_realtime !== false && (
                  <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-200 flex flex-col justify-center h-[88px]">
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
                )}
                {carsCount != null && poi.show_cars !== false && (
                  <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100 flex flex-col items-center justify-center h-[88px]">
                    <Car className="w-5 h-5 text-blue-500 mb-1" />
                    <div className="text-lg font-bold text-blue-700">= {carsCount.toLocaleString('fr-FR')}</div>
                    <div className="text-xs text-blue-400">voitures roulant</div>
                    <div className="text-[10px] text-blue-300">a 100 km/h (conso. elec.)</div>
                  </div>
                )}
              </div>
            )}

            {/* ---- Actions : grid 2×2 ---- */}
            <Divider />
            <div className="grid grid-cols-2 gap-3">
              {poi.show_email_report !== false && (
                <a
                  href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`}
                  className="bg-gray-50 rounded-xl px-4 py-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors"
                  title="Message par email"
                >
                  <Mail className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-tight">Message par email</span>
                </a>
              )}
              {poi.show_voice_report !== false && (
                <a
                  href={poi.voice_report_url || "https://app.ekoo.co/capture"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-xl px-4 py-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors"
                  title="Message par vocal"
                >
                  <Mic className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-tight">Message par vocal</span>
                </a>
              )}
              {poi.show_newsletter !== false && (
                <a
                  href={poi.newsletter_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-xl px-4 py-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors"
                  title="L'actu du parc par email"
                >
                  <Info className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-tight">L'actu du parc par email</span>
                </a>
              )}
              {poi.project_url && (
                <a
                  href={poi.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-50 rounded-xl px-4 py-4 flex items-center gap-3 hover:bg-indigo-50 transition-colors"
                  title="Site web du projet"
                >
                  <ExternalLink className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                  <span className="text-sm text-gray-600 leading-tight">Site web</span>
                </a>
              )}
            </div>

            {/* Description (en bas) */}
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
