
import React, { useState, useEffect, useMemo } from 'react';
import LeafletMap from '@/components/LeafletMap.jsx';
import ProjectLegend from '@/components/ProjectLegend.jsx';
import ProjectFilter from '@/components/ProjectFilter.jsx';
import { parsePOIData } from '@/utils/mapUtils.jsx';
import { AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
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

  // Filters State
  const [filters, setFilters] = useState({
    types: [],
    status: [],
    cities: []
  });

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
        const transformedData = filteredData.map(record => ({
          ...record,
          id: record.id,
          lat: record.latitude,
          lng: record.longitude,
          properties: {
             ...record
          }
        }));

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

  // Extract unique cities for filter
  const availableCities = useMemo(() => {
    const cities = new Set(pois.map(p => p.city).filter(Boolean));
    return Array.from(cities).sort();
  }, [pois]);

  // Filter Logic
  const filteredPois = useMemo(() => {
    return pois.filter(poi => {
      // Check energy_category (new) or type (legacy) for type filtering
      const poiEnergyType = poi.energy_category || poi.type;
      const typeMatch = filters.types.length === 0 || filters.types.includes(poiEnergyType);

      let statusMatch = filters.status.length === 0;
      if (!statusMatch && poi.status) {
         statusMatch = filters.status.includes(poi.status);
      }

      const cityMatch = filters.cities.length === 0 || (poi.city && filters.cities.includes(poi.city));

      return typeMatch && statusMatch && cityMatch;
    });
  }, [pois, filters]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative w-full transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] bg-white' : 'h-full flex flex-col md:flex-row gap-4 p-4'}`}>
      
      {/* Filters */}
      <div className={`${isFullscreen ? 'absolute left-4 top-4 z-[101] max-w-xs' : 'w-full md:w-1/4 h-auto md:h-full z-10'}`}>
        <ProjectFilter 
          filters={filters} 
          onFilterChange={setFilters} 
          resultCount={filteredPois.length}
          cities={availableCities}
        />
      </div>

      {/* Map Area */}
      <div className={`w-full relative rounded-xl overflow-hidden shadow-md border border-gray-200 ${isFullscreen ? 'h-full rounded-none border-0' : 'md:w-3/4 h-[500px] md:h-full'}`}>
        
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
          selectedPoiId={selectedPoiId}
        />
        
        <ProjectLegend />

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
               onClick={() => setFilters({ types: [], status: [], cities: [] })}
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
