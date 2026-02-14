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

const PoiEmbedPage = () => {
  const { poiId } = useParams();
  const [poi, setPoi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const { data: liveData, error: liveError, loading: liveLoading } = useHybridLiveData(poiId, 5000);

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

  // Formatage de la date/année de mise en exploitation
  const commissioningDate = poi.commissioning_date
    ? new Date(poi.commissioning_date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long'
      })
    : poi.commissioning_year
    ? `${poi.commissioning_year}`
    : null;

  // Calcul voitures basé sur la puissance LIVE (pas nominale)
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

  // Description avec "Lire plus/moins"
  const descriptionMaxLength = 200;
  const hasLongDescription = poi.description?.length > descriptionMaxLength;
  const descriptionDisplayed = hasLongDescription && !isDescriptionExpanded
    ? poi.description.slice(0, descriptionMaxLength) + '…'
    : poi.description;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Barre de couleur */}
          <div className="h-3 w-full" style={{ backgroundColor: typeColor }} />

          <div className="p-8">
            {/* Logo client en haut */}
            {poi.poi_logo_url && (
              <div className="flex justify-center mb-4">
                <img
                  src={poi.poi_logo_url}
                  alt={poi.name}
                  className="h-14 w-auto object-contain"
                />
              </div>
            )}

            {/* Badge type d'énergie */}
            <div className="mb-3">
              <span
                className="text-sm font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider text-white inline-flex items-center shadow-sm"
                style={{ backgroundColor: typeColor }}
              >
                {TypeIcon}
                {getEnergyLabel()}
              </span>
            </div>

            {/* Nom du parc */}
            <h1 className="text-3xl font-bold text-gray-900 leading-tight mb-1">
              {poi.display_name || poi.name}
            </h1>

            {/* Statut */}
            {poi.status && (
              <div className="flex items-center gap-2 mb-2 mt-1">
                <span className={`text-sm px-3 py-0.5 rounded-full border font-medium ${getStatusColorClass(poi.status)} capitalize`}>
                  {poi.status}
                </span>
              </div>
            )}

            {/* Date de mise en service */}
            {commissioningDate && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Mise en service : {commissioningDate}</span>
              </div>
            )}

            {/* Ville / Agglomération — cliquables vers la carte */}
            <div className="mb-5">
              <div className="flex items-center text-base text-gray-600">
                <Building className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
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
                  {!poi.city && !poi.region && 'Localisation non spécifiée'}
                </span>
              </div>
              {poi.intercommunalites?.length > 0 && (
                <div className="text-sm text-gray-500 mt-0.5 pl-6 flex flex-wrap gap-x-1">
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
              {poi.communes?.length > 0 && (
                <div className="flex items-center text-sm text-gray-500 mt-0.5 pl-5 flex-wrap gap-x-1">
                  <Home className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  {poi.communes.map((commune, i) => (
                    <span key={commune}>
                      <Link to={`/map?commune=${encodeURIComponent(commune)}`} className="hover:text-indigo-600 hover:underline">
                        {commune}
                      </Link>
                      {i < poi.communes.length - 1 && ', '}
                    </span>
                  ))}
                </div>
              )}
              {/* Itinéraire */}
              {poi.latitude != null && poi.longitude != null && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 hover:underline font-medium mt-1"
                >
                  <Navigation className="w-4 h-4 flex-shrink-0" />
                  Itinéraire
                </a>
              )}
            </div>

            {/* Puissance : Capacité (gauche) | Production en temps réel + voitures (droite) */}
            <div className="grid grid-cols-2 gap-6 mb-1">
              {/* Capacité */}
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <span className="block text-sm text-gray-500 mb-1">Capacité</span>
                {poi.nominal_power ? (
                  <span className="text-xl font-bold text-gray-900">
                    {poi.nominal_power} <span className="text-base font-medium">{poi.nominal_power_unit || 'MW'}</span>
                  </span>
                ) : (
                  <span className="text-base text-gray-400">—</span>
                )}
              </div>

              {/* Production en temps réel + voitures en dessous */}
              <div className="space-y-2">
                <div className="bg-green-50 rounded-lg px-4 py-3 border border-green-200">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm text-gray-500">Production en temps réel</span>
                    {liveData?.value != null && (
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                      </span>
                    )}
                  </div>
                  {liveError ? (
                    <span className="text-sm text-red-600">Erreur</span>
                  ) : liveLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  ) : liveData?.value != null ? (
                    <span className="text-xl font-bold text-green-700">
                      {typeof liveData.value === 'number' ? liveData.value.toFixed(1) : liveData.value}{' '}
                      <span className="text-base font-medium">{liveData.unit || 'MW'}</span>
                    </span>
                  ) : poi.actual_power ? (
                    <span className="text-xl font-bold text-green-700">
                      {poi.actual_power} <span className="text-base font-medium">{poi.actual_power_unit || 'MW'}</span>
                    </span>
                  ) : (
                    <span className="text-base text-gray-400">—</span>
                  )}
                </div>

                {carsCount != null && (
                  <div className="flex items-center justify-center gap-1.5 text-sm bg-blue-50 rounded-lg py-2 border border-blue-100 text-blue-700">
                    <Car className="w-5 h-5 flex-shrink-0" />
                    <span>= <strong>{carsCount.toLocaleString('fr-FR')}</strong> voitures roulant a 100 km/h</span>
                    <span className="text-[10px] text-blue-400 block">(consommation d'electricite)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Foyers alimentés */}
            {poi.households_equivalent && (
              <div className="flex items-center justify-center gap-1.5 text-sm bg-amber-50 rounded-lg py-2 border border-amber-100 text-amber-700 mt-2">
                <Home className="w-5 h-5 flex-shrink-0" />
                <span>≈ <strong>{poi.households_equivalent.toLocaleString('fr-FR')}</strong> foyers</span>
              </div>
            )}

            {/* Production annuelle */}
            {poi.annual_production_mwh && (
              <div className="border-t border-gray-100 pt-4 mt-3">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Zap className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                  <span>Productible annuel : <strong>{poi.annual_production_mwh.toLocaleString('fr-FR')} MWh/an</strong></span>
                </div>
              </div>
            )}

            {/* Description */}
            {poi.description && (
              <div className="border-t border-b border-gray-100 py-4 mb-4 mt-3">
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
            )}

            {/* Lien site web */}
            {poi.project_url && (
              <div className="mb-4">
                <a
                  href={poi.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-base text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Voir le site web
                </a>
              </div>
            )}

            {/* Signalement (mail + micro) */}
            {(poi.show_email_report !== false || poi.show_voice_report !== false) && (
              <div className="border-t border-gray-100 pt-4 mt-3">
                <div className="flex items-center gap-3 text-base text-gray-600">
                  <span className="text-gray-500">Signalement ?</span>
                  {poi.show_email_report !== false && (
                    <a
                      href={`mailto:${poi.contact_email || 'contact@quelia.fr'}`}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Par email"
                    >
                      <Mail className="w-6 h-6" />
                    </a>
                  )}
                  {poi.show_voice_report !== false && (
                    <a
                      href="https://app.ekoo.co/capture"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Par vocal"
                    >
                      <Mic className="w-6 h-6" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Newsletter — séparée du signalement */}
            {poi.show_newsletter !== false && (
              <div className="mt-3">
                <a
                  href="https://5e8e3e74.sibforms.com/serve/MUIFALMeowQ2_u9o7ZKghaSGt2q9gF_F-AO4Y5fae_qGmH8pdDoAqnohFKAnKsmwVbOMFr09VMIFCHrBqsmEuCNMltlAMGRhPBovsl2K6RkzPGoF94tkDj5p-hVijehAvVKums-TslaUnqRPKSwbNIC7EpxzK8oasGbFwNJQqKXPc-3wqQz4wUUz9Uj-SN6d4Eod8ROpEMl6jdaI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-base text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  <Info className="w-6 h-6 flex-shrink-0" />
                  <span>L'actu du parc par email</span>
                </a>
              </div>
            )}

            {/* Propulsé par Quelia */}
            <a
              href="https://quelia.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center text-sm text-gray-400 hover:text-indigo-500 transition-colors pt-3 mt-3 border-t border-gray-100"
            >
              Propulsé par <span className="font-semibold ml-1 text-gray-600">Quelia</span>
            </a>
          </div>

          {/* Footer with client branding */}
          {poi.client && (
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between">
              {poi.client.logo_url ? (
                <img
                  src={poi.client.logo_url}
                  alt={poi.client.name}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="text-sm font-medium text-gray-600">{poi.client.name}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoiEmbedPage;
