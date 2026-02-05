
import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import PointOfInterest from '@/components/PointOfInterest.jsx';
import { Target, Loader2 } from 'lucide-react';

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
      setTimeout(() => {
        map.flyTo([selectedPoi.lat, selectedPoi.lng], 14, { duration: 1 });
      }, 500);
    }
  }, [selectedPoiId, pois, map]);

  return null;
};

const LeafletMap = ({ center, zoom, onMapLoad, pois = [], selectedPoiId = null }) => {
  const mapRef = useRef(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const defaultCenter = [46.2276, 2.2137];
  const mapCenter = center || defaultCenter;
  const mapZoom = zoom || 6;

  const handleGeolocate = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setGeoLoading(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 12, { duration: 1.5 });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        setGeoError(true);
        setTimeout(() => setGeoError(false), 2000);
      }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-gray-100 isolate">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        whenCreated={(map) => {
          mapRef.current = map;
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

      {/* Bouton géolocalisation */}
      <button
        onClick={handleGeolocate}
        className={`absolute bottom-8 left-2 z-[1000] shadow-md rounded-lg p-2 border transition-colors ${
          geoError
            ? 'bg-red-50 border-red-200 hover:bg-red-100'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        }`}
        title="Me géolocaliser"
      >
        {geoLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        ) : (
          <Target className={`w-5 h-5 ${geoError ? 'text-red-500' : 'text-gray-700'}`} />
        )}
      </button>
    </div>
  );
};

export default LeafletMap;
