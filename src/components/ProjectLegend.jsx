
import React, { useState } from 'react';
import { getMarkerColor, ENERGY_CATEGORIES } from '@/utils/mapUtils.jsx';
import { ChevronDown, ChevronUp, Wind, Sun, Factory, Users, Droplet, CircleDot } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';

const LegendItem = ({ color, label, icon: Icon }) => (
  <div className="flex items-center space-x-2 mb-2 last:mb-0">
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      <Icon className="w-4 h-4 text-white" />
    </div>
    <span className="text-sm text-gray-700 font-medium">{label}</span>
  </div>
);

const ProjectLegend = () => {
  const [isOpen, setIsOpen] = useState(true);

  // Map energy categories to icons
  const categoryIcons = {
    solaire: Sun,
    éolien: Wind,
    biométhane: Factory,
    'cogénération-électricité': CircleDot,
    hydroélectricité: Droplet
  };

  return (
    <div className="absolute bottom-8 right-4 z-10 max-w-[200px] w-full">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <div
          className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h4 className="text-sm font-bold text-gray-900">Légende</h4>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-200">
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>

        {isOpen && (
          <div className="p-3">
            {/* Energy categories */}
            {Object.entries(ENERGY_CATEGORIES).map(([key, category]) => (
              <LegendItem
                key={key}
                color={getMarkerColor(key)}
                label={category.label}
                icon={categoryIcons[key] || Sun}
              />
            ))}

            <div className="mt-4 pt-3 border-t border-gray-100">
               <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Statut</p>
               <div className="space-y-1.5">
                 <div className="flex items-center">
                   <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span>
                   <span className="text-xs text-gray-600">En étude</span>
                 </div>
                 <div className="flex items-center">
                   <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-2"></span>
                   <span className="text-xs text-gray-600">En construction</span>
                 </div>
                 <div className="flex items-center">
                   <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>
                   <span className="text-xs text-gray-600">En exploitation</span>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectLegend;
