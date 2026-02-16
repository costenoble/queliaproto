
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import LeafletMap from '@/components/LeafletMap.jsx';
import ProjectLegend from '@/components/ProjectLegend.jsx';
import ProjectFilter from '@/components/ProjectFilter.jsx';
import MapSearchBar from '@/components/MapSearchBar.jsx';
import { parsePOIData, getMarkerColor, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import ProjectPopup from '@/components/ProjectPopup.jsx';
import { AlertCircle, Filter, Maximize2, Minimize2, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import mockData from '@/data/mockPOIData.json';

const MapContainer = ({ config, clientSlug = null, selectedPoiId = null }) => {
  const [map, setMap] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Data State
  const [pois, setPois] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL params for deep linking filters
  const [searchParams] = useSearchParams();

  // Filters State
  const [filters, setFilters] = useState({
    types: [],
    status: [],
    regions: []
  });

  // Read URL params on mount to pre-set filters
  useEffect(() => {
    const region = searchParams.get('region');
    if (region) {
      setFilters(prev => ({
        ...prev,
        regions: [region]
      }));
    }
  }, [searchParams]);

  // Zoom to city/region/intercommunalite from URL params once POIs + map are ready
  useEffect(() => {
    if (!map || pois.length === 0 || isLoading) return;

    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const interco = searchParams.get('intercommunalite');

    if (city) {
      const poisInCity = pois.filter(p => p.city === city && p.lat && p.lng);
      if (poisInCity.length > 0) {
        setTimeout(() => fitBoundsToPois(poisInCity), 300);
      }
    } else if (interco) {
      const poisInInterco = pois.filter(p =>
        p.intercommunalites?.includes(interco) && p.lat && p.lng
      );
      if (poisInInterco.length > 0) {
        setTimeout(() => fitBoundsToPois(poisInInterco, 10), 300);
      }
    } else if (region) {
      const poisInRegion = pois.filter(p => p.region === region && p.lat && p.lng);
      if (poisInRegion.length > 0) {
        setTimeout(() => fitBoundsToPois(poisInRegion, 8), 300);
      }
    }
  }, [map, pois, isLoading, searchParams, fitBoundsToPois]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);

        // Build query - filter by client slug if provided
        let query = supabase
          .from('projects')
          .select(`
            *,
            client:clients(id, name, slug, logo_url, primary_color)
          `)
          .order('created_at', { ascending: false });

        // Filter by client slug if provided
        if (clientSlug) {
          query = query.eq('client.slug', clientSlug);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Filter out projects without matching client (for client-specific views)
        const filteredData = clientSlug
          ? (data || []).filter(p => p.client?.slug === clientSlug)
          : (data || []);

        // Transform Supabase records to match POI format expected by components
        // Convertir kW en MW pour uniformiser les données
        const transformedData = filteredData.map(record => {
          // Conversion puissance nominale kW → MW
          let nominalPower = record.nominal_power;
          let nominalPowerUnit = record.nominal_power_unit || 'MW';
          if (nominalPowerUnit === 'kW' && nominalPower) {
            nominalPower = nominalPower / 1000;
            nominalPowerUnit = 'MW';
          }

          // Conversion puissance réelle kW → MW
          let actualPower = record.actual_power;
          let actualPowerUnit = record.actual_power_unit || 'MW';
          if (actualPowerUnit === 'kW' && actualPower) {
            actualPower = actualPower / 1000;
            actualPowerUnit = 'MW';
          }

          return {
            ...record,
            id: record.id,
            lat: record.latitude,
            lng: record.longitude,
            nominal_power: nominalPower,
            nominal_power_unit: nominalPowerUnit,
            actual_power: actualPower,
            actual_power_unit: actualPowerUnit,
            properties: {
               ...record,
               nominal_power: nominalPower,
               nominal_power_unit: nominalPowerUnit,
               actual_power: actualPower,
               actual_power_unit: actualPowerUnit
            }
          };
        });

        setPois(transformedData);

      } catch (err) {
        console.warn("Supabase fetch failed, using mock data fallback.", err);
        setPois(parsePOIData(mockData));
        setError("Mode démo (Offline)");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('public:projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        () => {
          fetchProjects();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientSlug]);

  const availableRegions = useMemo(() => {
    const regions = new Set(pois.map(p => p.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [pois]);

  // Filter Logic
  const filteredPois = useMemo(() => {
    return pois.filter(poi => {
      const poiEnergyType = poi.energy_category || poi.type;
      const typeMatch = filters.types.length === 0 || filters.types.includes(poiEnergyType);

      let statusMatch = filters.status.length === 0;
      if (!statusMatch && poi.status) {
         statusMatch = filters.status.includes(poi.status);
      }

      const regionMatch = filters.regions.length === 0 || (poi.region && filters.regions.includes(poi.region));

      return typeMatch && statusMatch && regionMatch;
    });
  }, [pois, filters]);

  // Bottom sheet POI
  const [activePoi, setActivePoi] = useState(null);

  // Search handlers
  const [searchSelectedPoiId, setSearchSelectedPoiId] = useState(null);

  const handleSelectProject = useCallback((poi) => {
    if (map && poi.lat && poi.lng) {
      // Réinitialiser les filtres pour que le POI soit visible
      setFilters({ types: [], status: [], regions: [] });
      setActivePoi(null);
      map.flyTo([poi.lat, poi.lng], 14, { duration: 1 });
      setSearchSelectedPoiId(poi.id);
    }
  }, [map]);

  // Zoom sur les bounds d'un ensemble de POIs
  // maxZoom contrôle le zoom max (utile pour régions avec peu de POIs)
  const fitBoundsToPois = useCallback((matchingPois, maxZoom = 14) => {
    if (!map || matchingPois.length === 0) return;
    if (matchingPois.length === 1) {
      map.flyTo([matchingPois[0].lat, matchingPois[0].lng], Math.min(12, maxZoom), { duration: 1 });
      return;
    }
    const L = window.L;
    if (!L) return;
    const bounds = L.latLngBounds(matchingPois.map(p => [p.lat, p.lng]));
    map.flyToBounds(bounds, { padding: [40, 40], maxZoom, duration: 1 });
  }, [map]);

  const handleSelectCity = useCallback((city) => {
    setSearchSelectedPoiId(null);
    setActivePoi(null);
    setTimeout(() => {
      const poisInCity = pois.filter(p => p.city === city && p.lat && p.lng);
      fitBoundsToPois(poisInCity);
    }, 150);
  }, [map, pois, fitBoundsToPois]);

  const handleSelectRegion = useCallback((region) => {
    setSearchSelectedPoiId(null);
    setActivePoi(null);
    setFilters(prev => ({
      ...prev,
      regions: [region]
    }));
    setTimeout(() => {
      const poisInRegion = pois.filter(p => p.region === region && p.lat && p.lng);
      fitBoundsToPois(poisInRegion, 8);
    }, 300);
  }, [map, pois, fitBoundsToPois]);

  // Mobile filter drawer state (lifted from ProjectFilter for mobile floating button)
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const hasActiveFilters =
    (filters.types?.length > 0) ||
    (filters.status?.length > 0) ||
    (filters.regions?.length > 0);

  // Energy chips for inline mobile bar
  const energyChips = useMemo(() =>
    Object.entries(ENERGY_CATEGORIES).map(([key, cat]) => ({
      id: key,
      label: cat.label,
      color: getMarkerColor(key),
    })),
  []);

  const toggleTypeFilter = useCallback((typeId) => {
    setFilters(prev => {
      const current = prev.types || [];
      const next = current.includes(typeId)
        ? current.filter(t => t !== typeId)
        : [...current, typeId];
      return { ...prev, types: next };
    });
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative w-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] bg-white' : 'h-full flex flex-col md:flex-row md:gap-4 md:p-4 md:max-h-[calc(100vh-80px)]'}`}>

      {/* Filters — desktop sidebar only */}
      <div className={`hidden ${isFullscreen ? 'md:block absolute left-4 top-4 z-[101] max-w-xs' : 'md:block md:w-1/4 md:h-full z-10'}`}>
        <ProjectFilter
          filters={filters}
          onFilterChange={setFilters}
          resultCount={filteredPois.length}
          regions={availableRegions}
        />
      </div>

      {/* Map Area */}
      <div className={`main-map w-full relative overflow-hidden shadow-md border-gray-200 ${isFullscreen ? 'h-full border-0' : 'md:w-3/4 md:flex-1 h-[calc(100vh-64px)] md:h-auto min-h-[500px] md:rounded-xl md:border'}`}>

        {/* Mobile: inline filter chips bar */}
        <div className="md:hidden absolute top-3 left-0 right-0 z-[1001] px-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* More filters button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className={`flex-shrink-0 flex items-center gap-1 bg-white/95 backdrop-blur-sm shadow-md rounded-full px-2.5 py-1.5 border text-xs font-medium active:scale-95 transition-all ${
                (filters.status?.length > 0 || filters.regions?.length > 0)
                  ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {(filters.status?.length || 0) + (filters.regions?.length || 0) > 0 && (
                <span className="bg-indigo-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {(filters.status?.length || 0) + (filters.regions?.length || 0)}
                </span>
              )}
            </button>

            {/* Energy type chips */}
            {energyChips.map((chip) => {
              const active = filters.types?.includes(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => toggleTypeFilter(chip.id)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border shadow-sm active:scale-95 transition-all ${
                    active
                      ? 'text-white border-transparent'
                      : 'bg-white/95 backdrop-blur-sm text-gray-700 border-gray-200'
                  }`}
                  style={active ? { backgroundColor: chip.color } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: active ? 'white' : chip.color }}
                  />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile: filter drawer */}
        {isMobileFilterOpen && (
          <div className="md:hidden fixed inset-0 z-[1002]">
            <ProjectFilter
              filters={filters}
              onFilterChange={setFilters}
              resultCount={filteredPois.length}
              regions={availableRegions}
              mobileOpen={true}
              onMobileClose={() => setIsMobileFilterOpen(false)}
            />
          </div>
        )}

        {/* Search Bar */}
        <MapSearchBar
          pois={pois}
          onSelectProject={handleSelectProject}
          onSelectCity={handleSelectCity}
          onSelectRegion={handleSelectRegion}
        />

        {/* Fullscreen Toggle */}
        <Button
          variant="secondary"
          size="sm"
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-[1000] bg-white shadow-md hover:bg-gray-100 hidden md:flex"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
          {isFullscreen ? 'Réduire' : 'Plein écran'}
        </Button>

        <LeafletMap
          center={config?.mapCenter || [46.2276, 2.2137]}
          zoom={config?.mapZoom || 6}
          onMapLoad={setMap}
          pois={filteredPois}
          selectedPoiId={searchSelectedPoiId || selectedPoiId}
          onSelectCity={handleSelectCity}
          onSelectRegion={handleSelectRegion}
          onSelectPoi={setActivePoi}
        />

        <ProjectLegend />

        {/* Bottom Sheet POI */}
        {activePoi && (
          <div className="absolute inset-0 z-[1001] pointer-events-none">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 pointer-events-auto"
              onClick={() => setActivePoi(null)}
            />
            {/* Sheet */}
            <div className="absolute bottom-0 left-0 right-0 pointer-events-auto animate-slide-up">
              <div className="bg-white rounded-t-2xl shadow-2xl max-h-[70vh] overflow-y-auto">
                {/* Drag handle + close */}
                <div className="sticky top-0 z-10 bg-white rounded-t-2xl pt-2 pb-1 px-3 flex items-center">
                  <div className="flex-1" />
                  <div className="w-10 h-1 bg-gray-300 rounded-full" />
                  <div className="flex-1 flex justify-end">
                    <button
                      onClick={() => setActivePoi(null)}
                      className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Content */}
                <ProjectPopup
                  poi={activePoi}
                  onSelectCity={(city) => { setActivePoi(null); handleSelectCity(city); }}
                  onSelectRegion={(region) => { setActivePoi(null); handleSelectRegion(region); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {isLoading && (
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
           </div>
        )}

        {/* No Results State */}
        {!isLoading && filteredPois.length === 0 && (
           <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur shadow-lg rounded-xl p-6 text-center z-[1000] border border-gray-200 max-w-sm">
             <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
             <h3 className="text-lg font-bold text-gray-900 mb-1">Aucun résultat</h3>
             <p className="text-gray-600 mb-4">Aucun projet ne correspond à vos filtres actuels.</p>
             <Button 
               onClick={() => setFilters({ types: [], status: [], regions: [] })}
               variant="outline"
             >
               Réinitialiser les filtres
             </Button>
           </div>
        )}
      </div>
    </div>
  );
};

export default MapContainer;
