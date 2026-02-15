
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
// Uses a ref for pois to avoid re-triggering when filtered list changes
const SelectedPoiHandler = ({ pois, selectedPoiId }) => {
  const map = useMap();
  const poisRef = useRef(pois);
  poisRef.current = pois;

  useEffect(() => {
    if (!selectedPoiId) return;

    const timer = setTimeout(() => {
      const currentPois = poisRef.current;
      if (!currentPois.length) return;
      const selectedPoi = currentPois.find(p => p.id === selectedPoiId);
      if (selectedPoi && selectedPoi.lat && selectedPoi.lng) {
        map.flyTo([selectedPoi.lat, selectedPoi.lng], 14, { duration: 1 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedPoiId, map]);

  return null;
};

// Component to capture map instance for external use (geolocation button)
const MapRefSetter = ({ mapRef, onMapLoad }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
    if (onMapLoad) onMapLoad(map);
  }, [map, mapRef, onMapLoad]);
  return null;
};

const LeafletMap = ({ center, zoom, onMapLoad, pois = [], selectedPoiId = null, onSelectCity, onSelectRegion, onSelectPoi }) => {
  const mapRef = useRef(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(false);

  const defaultCenter = [46.2276, 2.2137];
  const mapCenter = center || defaultCenter;
  // Zoom 5 pour voir toute la France sur mobile
  const mapZoom = zoom || 5;

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée par ce navigateur');
      return;
    }
    if (!mapRef.current) {
      console.error('Map ref not available');
      return;
    }
    setGeoLoading(true);
    setGeoError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 12, { duration: 1.5 });
        setGeoLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err.code, err.message);
        setGeoLoading(false);
        setGeoError(true);
        // Messages selon le code d'erreur
        const messages = {
          1: 'Autorisation refusée. Cliquez sur l\'icône cadenas dans la barre d\'adresse pour autoriser la localisation.',
          2: 'Position non disponible. Vérifiez que le GPS est activé.',
          3: 'Délai d\'attente dépassé.'
        };
        alert(messages[err.code] || 'Erreur de géolocalisation');
        setTimeout(() => setGeoError(false), 3000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden bg-gray-100 isolate">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        closePopupOnClick={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapRefSetter mapRef={mapRef} onMapLoad={onMapLoad} />
        <MapController center={center} zoom={zoom} />
        <SelectedPoiHandler pois={pois} selectedPoiId={selectedPoiId} />

        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {pois.map((poi) => (
            <PointOfInterest key={poi.id} poi={poi} isSelected={poi.id === selectedPoiId} onSelectPoi={onSelectPoi} onSelectCity={onSelectCity} onSelectRegion={onSelectRegion} />
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
