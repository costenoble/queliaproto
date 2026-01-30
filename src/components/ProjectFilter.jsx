
import React, { useState } from 'react';
import { Filter, Check, RotateCcw, ChevronDown, ChevronUp, MapPin, Zap, Activity, X } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { getMarkerColor, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';

const ProjectFilter = ({ filters, onFilterChange, resultCount, cities = [] }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const [collapsedSections, setCollapsedSections] = useState({
    types: false,
    status: false,
    regions: false
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Build energy types from ENERGY_CATEGORIES
  const energyTypes = Object.entries(ENERGY_CATEGORIES).map(([key, category]) => ({
    id: key,
    label: category.label,
    color: getMarkerColor(key)
  }));

  const statuses = [
    { id: 'en étude', label: 'En étude' },
    { id: 'en construction', label: 'En construction' },
    { id: 'en exploitation', label: 'En exploitation' },
    { id: 'consultation en cours', label: 'Consultation en cours' }
  ];

  const isSelected = (category, id) => {
    return filters[category] && filters[category].includes(id);
  };

  const toggleSelection = (category, id) => {
    const currentSelection = filters[category] || [];
    let newSelection;
    
    if (currentSelection.includes(id)) {
      newSelection = currentSelection.filter(item => item !== id);
    } else {
      newSelection = [...currentSelection, id];
    }
    
    onFilterChange({
      ...filters,
      [category]: newSelection
    });
  };

  const resetFilters = () => {
    onFilterChange({
      types: [],
      status: [],
      cities: []
    });
  };

  const hasActiveFilters = 
    (filters.types && filters.types.length > 0) || 
    (filters.status && filters.status.length > 0) || 
    (filters.cities && filters.cities.length > 0);

  // Content rendering function to reuse between desktop sidebar and mobile drawer
  const renderFilterContent = () => (
    <div className="space-y-6">
       {/* Project Types */}
       <div className="border border-gray-100 rounded-lg overflow-hidden">
          <button 
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => toggleSection('types')}
          >
            <div className="flex items-center font-semibold text-gray-700 text-sm">
              <Zap className="w-5 h-5 mr-3 text-gray-400" />
              Type de projet
              {filters.types?.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                  {filters.types.length}
                </span>
              )}
            </div>
            {collapsedSections.types ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </button>
          
          {!collapsedSections.types && (
            <div className="p-3 space-y-2 bg-white">
              {energyTypes.map((type) => (
                <div 
                  key={type.id}
                  onClick={() => toggleSelection('types', type.id)}
                  className={`
                    flex items-center p-3 rounded-md cursor-pointer transition-all border min-h-[44px]
                    ${isSelected('types', type.id) 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                    }
                  `}
                >
                  <div 
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                      isSelected('types', type.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected('types', type.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: type.color }}
                  ></div>
                  <span className={`text-base ${isSelected('types', type.id) ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {type.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Project Status */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <button 
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => toggleSection('status')}
          >
            <div className="flex items-center font-semibold text-gray-700 text-sm">
              <Activity className="w-5 h-5 mr-3 text-gray-400" />
              Statut d'avancement
              {filters.status?.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                  {filters.status.length}
                </span>
              )}
            </div>
            {collapsedSections.status ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </button>
          
          {!collapsedSections.status && (
            <div className="p-3 space-y-2 bg-white">
              {statuses.map((status) => (
                <div 
                  key={status.id}
                  onClick={() => toggleSelection('status', status.id)}
                  className={`
                    flex items-center p-3 rounded-md cursor-pointer transition-all border min-h-[44px]
                    ${isSelected('status', status.id) 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                    }
                  `}
                >
                  <div 
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                      isSelected('status', status.id) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected('status', status.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-base ${isSelected('status', status.id) ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {status.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Regions/Cities */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <button 
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => toggleSection('regions')}
          >
            <div className="flex items-center font-semibold text-gray-700 text-sm">
              <MapPin className="w-5 h-5 mr-3 text-gray-400" />
              Villes
              {filters.cities?.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                  {filters.cities.length}
                </span>
              )}
            </div>
            {collapsedSections.regions ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </button>
          
          {!collapsedSections.regions && (
            <div className="p-3 space-y-2 bg-white max-h-60 overflow-y-auto">
              {cities.map((city) => (
                <div 
                  key={city}
                  onClick={() => toggleSelection('cities', city)}
                  className={`
                    flex items-center p-3 rounded-md cursor-pointer transition-all border min-h-[44px]
                    ${isSelected('cities', city) 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                    }
                  `}
                >
                  <div 
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                      isSelected('cities', city) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected('cities', city) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-base ${isSelected('cities', city) ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {city}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden mb-4">
        <Button 
          onClick={() => setIsOpenMobile(true)} 
          className="w-full bg-white text-gray-800 border border-gray-300 shadow-sm hover:bg-gray-50 flex justify-between items-center py-6"
        >
          <span className="flex items-center text-base">
            <Filter className="w-5 h-5 mr-2 text-indigo-600" />
            Filtres ({resultCount} résultats)
          </span>
          <ChevronDown className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-[1001] md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsOpenMobile(false)}
          ></div>
          
          {/* Drawer Content */}
          <div className="absolute inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-indigo-600" />
                Filtres
              </h2>
              <button 
                onClick={() => setIsOpenMobile(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px]"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {renderFilterContent()}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex gap-3">
                 {hasActiveFilters && (
                    <Button 
                      variant="outline" 
                      onClick={resetFilters}
                      className="flex-1 text-red-600 border-red-200 hover:bg-red-50 min-h-[44px]"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </Button>
                  )}
                  <Button 
                    className="flex-1 min-h-[44px]"
                    onClick={() => setIsOpenMobile(false)}
                  >
                    Voir {resultCount} projets
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:flex bg-white p-5 shadow-lg rounded-xl border border-gray-100 flex-col h-full max-h-[calc(100vh-120px)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4 flex-shrink-0">
          <div className="flex items-center text-gray-900 font-bold text-lg">
            <Filter className="w-5 h-5 mr-2 text-indigo-600" />
            Filtres
          </div>
          
          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 h-8"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
          
          {/* Result Count */}
          <div className="bg-indigo-50 text-indigo-700 px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-center shadow-sm mb-6">
            {resultCount} projet{resultCount !== 1 ? 's' : ''} visible{resultCount !== 1 ? 's' : ''}
          </div>

          {renderFilterContent()}

        </div>
      </div>
    </>
  );
};

export default ProjectFilter;
