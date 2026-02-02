
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import MapContainer from '@/components/MapContainer.jsx';

const MapPage = () => {
  const [config, setConfig] = useState({
    dataUrl: '',
    // Fixed coordinates order: [Latitude, Longitude] for Leaflet
    mapCenter: [46.2276, 2.2137], // France center
    mapZoom: 6 // Set to 6 as requested for better initial view
  });

  return (
    <>
      <Helmet>
        <title>Carte Interactive - Quelia</title>
        <meta name="description" content="Visualisez nos projets d'énergies renouvelables sur notre carte interactive : éolien, solaire, méthanisation et concertation publique." />
      </Helmet>

      <div className="flex flex-col flex-1 h-full bg-gray-50">
        <div className="flex-1 flex flex-col h-full relative">
          <main className="flex-1 relative z-0 h-[calc(100vh-80px)] min-h-[600px]">
            <MapContainer config={config} />
          </main>
        </div>
      </div>
    </>
  );
};

export default MapPage;
