
import React, { useRef, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerColor, getMarkerIconSvg } from '@/utils/mapUtils.jsx';
import ProjectPopup from '@/components/ProjectPopup.jsx';

const PointOfInterest = ({ poi, isSelected = false, onSelectCity, onSelectRegion }) => {
  const markerRef = useRef(null);
  const map = useMap();

  useEffect(() => {
    if (isSelected && markerRef.current) {
      setTimeout(() => {
        markerRef.current.openPopup();
      }, 1500);
    }
  }, [isSelected]);

  // Au clic sur le marker : centrer la carte d'abord, puis ouvrir le popup
  const handleClick = () => {
    if (!markerRef.current) return;
    const marker = markerRef.current;
    const latlng = marker.getLatLng();

    // Centrer la carte sur le marker avec un offset vers le bas
    // pour que le popup (au-dessus) soit bien visible
    const point = map.latLngToContainerPoint(latlng);
    const offsetPoint = L.point(point.x, point.y + 120);
    const offsetLatLng = map.containerPointToLatLng(offsetPoint);

    map.panTo(offsetLatLng, { animate: true, duration: 0.3 });

    // Ouvrir le popup après le pan
    setTimeout(() => {
      marker.openPopup();
    }, 350);
  };

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
        autoPan={false}
      >
        <ProjectPopup poi={poi} onSelectCity={onSelectCity} onSelectRegion={onSelectRegion} />
      </Popup>
    </Marker>
  );
};

export default PointOfInterest;
