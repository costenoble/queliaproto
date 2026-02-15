import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, MapPin, Building, Globe } from 'lucide-react';
import { getMarkerIconComponent, getMarkerColor } from '@/utils/mapUtils.jsx';

const MapSearchBar = ({ pois, onSelectProject, onSelectCity, onSelectRegion }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recherche dans les POIs
  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return { projects: [], cities: [], regions: [] };

    const q = query.toLowerCase();

    // Projets qui matchent
    const projects = pois
      .filter(poi =>
        poi.name?.toLowerCase().includes(q) ||
        poi.display_name?.toLowerCase().includes(q) ||
        (poi.energy_category || poi.type)?.toLowerCase().includes(q) ||
        poi.energy_subtype?.toLowerCase().includes(q)
      )
      .slice(0, 5);

    // Villes uniques qui matchent
    const citySet = new Set();
    pois.forEach(poi => {
      if (poi.city?.toLowerCase().includes(q)) citySet.add(poi.city);
    });
    const cities = Array.from(citySet).slice(0, 3);

    // Régions uniques qui matchent
    const regionSet = new Set();
    pois.forEach(poi => {
      if (poi.region?.toLowerCase().includes(q)) regionSet.add(poi.region);
    });
    const regions = Array.from(regionSet).slice(0, 3);

    return { projects, cities, regions };
  }, [query, pois]);

  const hasResults = suggestions.projects.length > 0 ||
    suggestions.cities.length > 0 ||
    suggestions.regions.length > 0;

  const handleSelect = (type, value) => {
    if (type === 'project') onSelectProject(value);
    else if (type === 'city') onSelectCity(value);
    else if (type === 'region') onSelectRegion(value);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="absolute top-12 left-3 right-3 md:top-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1001] md:w-[90%] max-w-md">
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher un projet, une ville, une région…"
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setIsOpen(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {isOpen && query.length >= 2 && (
        <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
          {!hasResults && (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Aucun résultat pour "{query}"
            </div>
          )}

          {/* Projets */}
          {suggestions.projects.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-50">
                Projets
              </div>
              {suggestions.projects.map(poi => {
                const energyType = poi.energy_category || poi.type;
                const TypeIcon = getMarkerIconComponent(energyType, 'w-3.5 h-3.5');
                const color = getMarkerColor(energyType);
                return (
                  <button
                    key={poi.id}
                    onClick={() => handleSelect('project', poi)}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-indigo-50 text-left transition-colors"
                  >
                    <span className="flex-shrink-0 p-1 rounded" style={{ backgroundColor: color + '20', color }}>
                      {TypeIcon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {poi.display_name || poi.name}
                      </div>
                      <div className="text-[11px] text-gray-500 truncate">
                        {poi.city}{poi.region ? ` · ${poi.region}` : ''}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Villes */}
          {suggestions.cities.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-50">
                Villes
              </div>
              {suggestions.cities.map(city => (
                <button
                  key={city}
                  onClick={() => handleSelect('city', city)}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-indigo-50 text-left transition-colors"
                >
                  <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{city}</span>
                </button>
              ))}
            </div>
          )}

          {/* Régions */}
          {suggestions.regions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-50">
                Régions
              </div>
              {suggestions.regions.map(region => (
                <button
                  key={region}
                  onClick={() => handleSelect('region', region)}
                  className="w-full px-3 py-2 flex items-center gap-2 hover:bg-indigo-50 text-left transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{region}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapSearchBar;
