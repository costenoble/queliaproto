
import React from 'react';
import { getStatusColorClass, getMarkerColor, getMarkerIconComponent } from '@/utils/mapUtils.jsx';
import { Calendar, Activity, Zap, MapPin, Building } from 'lucide-react';

const ProjectPopup = ({ poi }) => {
  if (!poi) return null;

  const statusClass = getStatusColorClass(poi.status);
  const typeColor = getMarkerColor(poi.type);
  const TypeIcon = getMarkerIconComponent(poi.type, "w-4 h-4 mr-1");

  return (
    <div className="w-80 bg-white overflow-hidden font-sans rounded-lg shadow-sm">
      <div 
        className="h-2 w-full" 
        style={{ backgroundColor: typeColor }}
      ></div>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <span 
            className="text-xs font-bold px-2 py-1 rounded uppercase tracking-wider text-white flex items-center shadow-sm"
            style={{ backgroundColor: typeColor }}
          >
            {TypeIcon}
            {poi.type}
          </span>
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
          {poi.name}
        </h3>

        <div className="flex flex-col gap-1 mb-4">
          <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-full w-fit">
            <Building className="w-3 h-3 mr-1" />
            {poi.city || 'Ville non spécifiée'}
          </div>
          
          {poi.address && (
            <div className="flex items-start text-xs text-gray-600 px-1 mt-1 border-t border-gray-100 pt-2 w-full">
              <MapPin className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5 text-gray-400" />
              <span className="leading-snug">{poi.address}</span>
            </div>
          )}

          {poi.status && (
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded-full border font-medium ${statusClass} capitalize w-fit`}>
                {poi.status}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-5 leading-relaxed border-t border-b border-gray-100 py-3">
          {poi.description}
        </p>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {poi.capacity && poi.capacity !== 'N/A' && (
            <div className="flex items-start text-gray-700">
              <Zap className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-500">Puissance</span>
                <span className="font-semibold">{poi.capacity}</span>
              </div>
            </div>
          )}
          
          {(poi.startDate) && (
            <div className="flex items-start text-gray-700">
              <Calendar className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <span className="block text-xs text-gray-500">Début</span>
                <span className="font-semibold">{new Date(poi.startDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          )}

          <div className="flex items-start text-gray-700">
             <Activity className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
             <div>
               <span className="block text-xs text-gray-500">Référence</span>
               <span className="font-mono text-xs">{poi.id ? poi.id.substring(0, 8) + '...' : 'N/A'}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPopup;
