
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import PointOfInterest from '@/components/PointOfInterest.jsx';

// Component to handle map view updates when props change
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom());
    } else if (zoom) {
      map.setZoom(zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Component to handle auto-opening a selected POI
const SelectedPoiHandler = ({ pois, selectedPoiId }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedPoiId || !pois.length) return;

    const selectedPoi = pois.find(p => p.id === selectedPoiId);
    if (selectedPoi && selectedPoi.lat && selectedPoi.lng) {
      // Center map on the selected POI with a good zoom level
      setTimeout(() => {
        map.flyTo([selectedPoi.lat, selectedPoi.lng], 14, { duration: 1 });
      }, 500);
    }
  }, [selectedPoiId, pois, map]);

  return null;
};

const LeafletMap = ({ center, zoom, onMapLoad, pois = [], selectedPoiId = null }) => {
  // Default center (France) - ensuring consistent fallback
  const defaultCenter = [46.2276, 2.2137];
  const mapCenter = center || defaultCenter;
  const mapZoom = zoom || 6;

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-gray-100 isolate">
       {/* isolate class ensures z-indexing works correctly within this container */}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        whenCreated={(map) => {
          if (onMapLoad) onMapLoad(map);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={center} zoom={zoom} />
        <SelectedPoiHandler pois={pois} selectedPoiId={selectedPoiId} />

        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {pois.map((poi) => (
            <PointOfInterest key={poi.id} poi={poi} isSelected={poi.id === selectedPoiId} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
