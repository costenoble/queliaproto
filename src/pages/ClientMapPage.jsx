
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import MapContainer from '@/components/MapContainer.jsx';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, AlertTriangle } from 'lucide-react';

const ClientMapPage = () => {
  const { clientSlug } = useParams();
  const [searchParams] = useSearchParams();
  const selectedPoiId = searchParams.get('poi');
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [config] = useState({
    mapCenter: [46.2276, 2.2137],
    mapZoom: 6
  });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('slug', clientSlug)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Client non trouvé');
          } else {
            throw error;
          }
          return;
        }

        setClient(data);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Erreur lors du chargement');
      } finally {
        setIsLoading(false);
      }
    };

    if (clientSlug) {
      fetchClient();
    }
  }, [clientSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600 mb-4">
            Le client "{clientSlug}" n'existe pas ou n'est plus disponible.
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{client?.name ? `Carte - ${client.name}` : 'Carte Interactive'}</title>
        <meta name="description" content={`Visualisez les projets de ${client?.name || 'notre client'} sur la carte interactive.`} />
      </Helmet>

      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header avec branding client */}
        <header
          className="py-4 px-6 shadow-sm"
          style={{ backgroundColor: client?.primary_color || '#4f46e5' }}
        >
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            {client?.logo_url ? (
              <img
                src={client.logo_url}
                alt={client.name}
                className="h-10 w-auto object-contain bg-white rounded-lg p-1"
              />
            ) : (
              <h1 className="text-xl font-bold text-white">
                {client?.name || 'Carte des projets'}
              </h1>
            )}
          </div>
        </header>

        {/* Carte */}
        <div className="flex-1 relative">
          <main className="h-[calc(100vh-72px)] min-h-[500px]">
            <MapContainer config={config} clientSlug={clientSlug} selectedPoiId={selectedPoiId} />
          </main>
        </div>
      </div>
    </>
  );
};

export default ClientMapPage;
