
import React, { useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerColor, getMarkerIconSvg } from '@/utils/mapUtils.jsx';
import ProjectPopup from '@/components/ProjectPopup.jsx';

const PointOfInterest = ({ poi, isSelected = false, onSelectCity, onSelectRegion }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      // Delay to ensure the map has finished flying to the location
      setTimeout(() => {
        markerRef.current.openPopup();
      }, 1500);
    }
  }, [isSelected]);

  if (!poi || !poi.lat || !poi.lng) return null;

  // Use energy_category for color/icon, fallback to legacy type
  const energyType = poi.energy_category || poi.type;
  const color = getMarkerColor(energyType);
  const svgIcon = getMarkerIconSvg(energyType, 'white');

  // Create a custom DivIcon that mimics the previous CSS styling
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

  return (
    <Marker ref={markerRef} position={[poi.lat, poi.lng]} icon={customIcon}>
      <Popup className="project-popup-wrapper" maxWidth={320} closeButton={true}>
        <ProjectPopup poi={poi} onSelectCity={onSelectCity} onSelectRegion={onSelectRegion} />
      </Popup>
    </Marker>
  );
};

export default PointOfInterest;
