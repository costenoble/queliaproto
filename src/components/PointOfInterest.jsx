
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerColor, getMarkerIconSvg } from '@/utils/mapUtils.jsx';
import ProjectPopup from '@/components/ProjectPopup.jsx';

const PointOfInterest = ({ poi }) => {
  if (!poi || !poi.lat || !poi.lng) return null;

  const color = getMarkerColor(poi.type);
  const svgIcon = getMarkerIconSvg(poi.type, 'white');

  // Create a custom DivIcon that mimics the previous CSS styling
  const customIcon = L.divIcon({
    className: 'custom-poi-marker', // We'll rely on inline styles in the HTML for specific colors
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
    iconAnchor: [16, 32], // Center bottom
    popupAnchor: [0, -34] // Above the icon
  });

  return (
    <Marker position={[poi.lat, poi.lng]} icon={customIcon}>
      <Popup className="project-popup-wrapper" maxWidth={320} closeButton={false}>
        <ProjectPopup poi={poi} />
      </Popup>
    </Marker>
  );
};

export default PointOfInterest;
