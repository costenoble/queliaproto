
import { useRef, useEffect } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerColor, getMarkerIconSvg } from '@/utils/mapUtils.jsx';

const PointOfInterest = ({ poi, isSelected = false, onSelectPoi }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (isSelected && onSelectPoi) {
      // Delay pour laisser le flyTo se terminer
      setTimeout(() => {
        onSelectPoi(poi);
      }, 1500);
    }
  }, [isSelected]);

  if (!poi || !poi.lat || !poi.lng) return null;

  const energyType = poi.energy_category || poi.type;
  const color = getMarkerColor(energyType);
  const svgIcon = getMarkerIconSvg(energyType, 'white');

  const customIcon = L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
      ">
        ${svgIcon}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34]
  });

  const handleClick = () => {
    onSelectPoi?.(poi);
  };

  return (
    <Marker
      ref={markerRef}
      position={[poi.lat, poi.lng]}
      icon={customIcon}
      eventHandlers={{ click: handleClick }}
    />
  );
};

export default PointOfInterest;
