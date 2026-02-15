
import { useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerColor, getMarkerIconSvg } from '@/utils/mapUtils.jsx';
import ProjectPopup from '@/components/ProjectPopup.jsx';

const MOBILE_BREAKPOINT = 768;

const PointOfInterest = ({ poi, isSelected = false, onSelectPoi, onSelectCity, onSelectRegion }) => {
  const markerRef = useRef(null);

  const isMobile = () => window.innerWidth < MOBILE_BREAKPOINT;

  useEffect(() => {
    if (!isSelected) return;
    // Delay pour laisser le flyTo se terminer
    setTimeout(() => {
      if (isMobile()) {
        onSelectPoi?.(poi);
      } else if (markerRef.current) {
        markerRef.current.openPopup();
      }
    }, 1500);
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
    if (isMobile()) {
      // Mobile : bottom sheet via MapContainer, fermer le popup Leaflet
      onSelectPoi?.(poi);
      setTimeout(() => markerRef.current?.closePopup(), 0);
    }
    // Desktop : le Popup Leaflet s'ouvre naturellement
  };

  return (
    <Marker
      ref={markerRef}
      position={[poi.lat, poi.lng]}
      icon={customIcon}
      eventHandlers={{ click: handleClick }}
    >
      <Popup
        className="project-popup-wrapper"
        maxWidth={320}
        closeButton={true}
      >
        <ProjectPopup poi={poi} onSelectCity={onSelectCity} onSelectRegion={onSelectRegion} />
      </Popup>
    </Marker>
  );
};

export default PointOfInterest;
