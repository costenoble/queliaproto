
import React, { useState } from 'react';
import { Filter, Check, RotateCcw, ChevronDown, ChevronUp, Zap, Activity, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { getMarkerColor, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';

const ProjectFilter = ({ filters, onFilterChange, resultCount, regions = [], mobileOpen = false, onMobileClose }) => {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  // Si mobileOpen est contrôlé depuis le parent, on l'utilise
  const isMobileDrawerOpen = onMobileClose ? mobileOpen : isOpenMobile;
  const closeMobileDrawer = onMobileClose || (() => setIsOpenMobile(false));

  const [collapsedSections, setCollapsedSections] = useState({
    types: false,
    status: false,
    region: false
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
    { id: 'en projet', label: 'En projet' },
    { id: 'en exploitation', label: 'En exploitation' }
  ];

  const isSelected = (category, id) => {
    return filters[category] && filters[category].includes(id);
  };

  const toggleSelection = (category, id) => {
    const currentSelection = filters[category] || [];
    let newSelection;
    const isRemoving = currentSelection.includes(id);

    if (isRemoving) {
      newSelection = currentSelection.filter(item => item !== id);
    } else {
      newSelection = [...currentSelection, id];
    }

    // Clean up subtypes when deselecting a type
    let newSubtypes = filters.subtypes || [];
    if (category === 'types' && isRemoving) {
      const categorySubtypes = ENERGY_CATEGORIES[id]?.subtypes?.map(s => s.value) || [];
      newSubtypes = newSubtypes.filter(s => !categorySubtypes.includes(s));
    }

    onFilterChange({
      ...filters,
      [category]: newSelection,
      subtypes: newSubtypes
    });
  };

  const resetFilters = () => {
    onFilterChange({
      types: [],
      subtypes: [],
      status: [],
      regions: []
    });
  };

  const toggleSubtype = (subtypeValue, parentTypeId) => {
    const currentSubtypes = filters.subtypes || [];
    let newSubtypes;
    if (currentSubtypes.includes(subtypeValue)) {
      newSubtypes = currentSubtypes.filter(s => s !== subtypeValue);
    } else {
      newSubtypes = [...currentSubtypes, subtypeValue];
    }
    // Auto-select parent type if not already selected
    const currentTypes = filters.types || [];
    const newTypes = currentTypes.includes(parentTypeId)
      ? currentTypes
      : [...currentTypes, parentTypeId];
    onFilterChange({ ...filters, types: newTypes, subtypes: newSubtypes });
  };

  const hasActiveFilters =
    (filters.types && filters.types.length > 0) ||
    (filters.subtypes && filters.subtypes.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.regions && filters.regions.length > 0);

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
              Énergie
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
              {energyTypes.map((type) => {
                const subtypes = ENERGY_CATEGORIES[type.id]?.subtypes || [];
                const typeSelected = isSelected('types', type.id);
                return (
                  <div key={type.id}>
                    <div
                      onClick={() => toggleSelection('types', type.id)}
                      className={`
                        flex items-center p-3 rounded-md cursor-pointer transition-all border min-h-[44px]
                        ${typeSelected
                          ? 'bg-indigo-50 border-indigo-200'
                          : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                        }
                      `}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                          typeSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {typeSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <span className={`text-base ${typeSelected ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {type.label}
                      </span>
                    </div>
                    {/* Subtypes — shown when parent type is selected */}
                    {typeSelected && subtypes.length > 0 && (
                      <div className="ml-8 mt-1 mb-1 space-y-1">
                        {subtypes.map((sub) => {
                          const subSelected = (filters.subtypes || []).includes(sub.value);
                          return (
                            <div
                              key={sub.value}
                              onClick={() => toggleSubtype(sub.value, type.id)}
                              className={`
                                flex items-center p-2 pl-3 rounded-md cursor-pointer transition-all border min-h-[36px] text-sm
                                ${subSelected
                                  ? 'bg-indigo-50/70 border-indigo-200'
                                  : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                                }
                              `}
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center mr-2 transition-colors ${
                                  subSelected ? 'border-transparent' : 'border-gray-300 bg-white'
                                }`}
                                style={subSelected ? { backgroundColor: type.color } : {}}
                              >
                                {subSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={subSelected ? 'font-medium text-gray-900' : 'text-gray-500'}>
                                {sub.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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

        {/* Région */}
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
            onClick={() => toggleSection('region')}
          >
            <div className="flex items-center font-semibold text-gray-700 text-sm">
              <Globe className="w-5 h-5 mr-3 text-gray-400" />
              Région
              {filters.regions?.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                  {filters.regions.length}
                </span>
              )}
            </div>
            {collapsedSections.region ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
          </button>

          {!collapsedSections.region && (
            <div className="p-3 space-y-2 bg-white max-h-60 overflow-y-auto">
              {regions.map((region) => (
                <div
                  key={region}
                  onClick={() => toggleSelection('regions', region)}
                  className={`
                    flex items-center p-3 rounded-md cursor-pointer transition-all border min-h-[44px]
                    ${isSelected('regions', region)
                      ? 'bg-indigo-50 border-indigo-200'
                      : 'hover:bg-gray-50 border-transparent hover:border-gray-100'
                    }
                  `}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${
                      isSelected('regions', region) ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected('regions', region) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className={`text-base ${isSelected('regions', region) ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                    {region}
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
      {/* Mobile Toggle Button — only shown when NOT controlled by parent */}
      {!onMobileClose && (
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
      )}

      {/* Mobile Bottom Sheet Filters */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-[1001] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeMobileDrawer}
          />

          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 animate-slide-up">
            <div className="bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col">
              {/* Handle + close */}
              <div className="pt-2 pb-1 px-4 flex items-center flex-shrink-0">
                <div className="flex-1" />
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
                <div className="flex-1 flex justify-end">
                  <button
                    onClick={closeMobileDrawer}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Header */}
              <div className="px-4 pb-3 flex items-center justify-between flex-shrink-0">
                <h2 className="text-base font-bold text-gray-900">Filtres</h2>
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="text-xs text-red-500 font-medium flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" />
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Scrollable content with chips */}
              <div className="overflow-y-auto px-4 pb-4 space-y-4 flex-1">

                {/* Énergie — chips with color dots */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Énergie</p>
                  <div className="flex flex-wrap gap-2">
                    {energyTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => toggleSelection('types', type.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                          isSelected('types', type.id)
                            ? 'text-white border-transparent shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200'
                        }`}
                        style={isSelected('types', type.id) ? { backgroundColor: type.color } : {}}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isSelected('types', type.id) ? 'white' : type.color }}
                        />
                        {type.label}
                      </button>
                    ))}
                  </div>
                  {/* Subtype chips — appear under energy chips when a type with subtypes is selected */}
                  {energyTypes.some(t => isSelected('types', t.id) && (ENERGY_CATEGORIES[t.id]?.subtypes?.length > 0)) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {energyTypes
                        .filter(t => isSelected('types', t.id) && (ENERGY_CATEGORIES[t.id]?.subtypes?.length > 0))
                        .flatMap(t =>
                          ENERGY_CATEGORIES[t.id].subtypes.map(sub => ({ ...sub, color: t.color, parentId: t.id }))
                        )
                        .map((sub) => {
                          const active = (filters.subtypes || []).includes(sub.value);
                          return (
                            <button
                              key={sub.value}
                              onClick={() => toggleSubtype(sub.value, sub.parentId)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all active:scale-95 ${
                                active
                                  ? 'text-white border-transparent shadow-sm'
                                  : 'bg-white text-gray-600 border-gray-200'
                              }`}
                              style={active ? { backgroundColor: sub.color } : {}}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Statut — chips */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Statut</p>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <button
                        key={status.id}
                        onClick={() => toggleSelection('status', status.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                          isSelected('status', status.id)
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200'
                        }`}
                      >
                        {isSelected('status', status.id) && <Check className="w-3 h-3" />}
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Régions — chips scrollables */}
                {regions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Région</p>
                    <div className="flex flex-wrap gap-2">
                      {regions.map((region) => (
                        <button
                          key={region}
                          onClick={() => toggleSelection('regions', region)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all active:scale-95 ${
                            isSelected('regions', region)
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-white text-gray-700 border-gray-200'
                          }`}
                        >
                          {isSelected('regions', region) && <Check className="w-3 h-3" />}
                          {region}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer button */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-none flex-shrink-0">
                <Button className="w-full min-h-[44px] text-base" onClick={closeMobileDrawer}>
                  Voir {resultCount} site{resultCount !== 1 ? 's' : ''}
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
            {resultCount} site{resultCount !== 1 ? 's' : ''} répertorié{resultCount !== 1 ? 's' : ''}
          </div>

          {renderFilterContent()}

        </div>
      </div>
    </>
  );
};

export default ProjectFilter;
