
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { AlertCircle, Calendar, MapPin, Save, Zap, Building, Flag, AlignLeft, Globe, Link as LinkIcon, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// Component to handle map clicks
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? (
    <Marker position={position} />
  ) : null;
};

const ProjectForm = ({ project, onSuccess, onCancel, clientId, clients }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [error, setError] = useState(null);

  // Selected client for super_admin
  const [selectedClientId, setSelectedClientId] = useState(project?.client_id || clientId || '');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Parc éolien',
    status: 'en étude',
    city: '',
    address: '',
    latitude: 46.2276,
    longitude: 2.2137,
    startDate: '',
    capacity: '',
    description: '',
    urlType: 'Website URL',
    projectUrl: ''
  });

  // Map position state
  const [mapPosition, setMapPosition] = useState(null);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        type: project.type || 'Parc éolien',
        status: project.status || 'en étude',
        city: project.city || '',
        address: project.address || '',
        latitude: project.latitude || 46.2276,
        longitude: project.longitude || 2.2137,
        startDate: project.start_date ? project.start_date.split('T')[0] : '',
        capacity: project.capacity || '',
        description: project.description || '',
        urlType: project.url_type || 'Website URL',
        projectUrl: project.project_url || ''
      });
      if (project.latitude && project.longitude) {
        setMapPosition({ lat: project.latitude, lng: project.longitude });
      }
      // Set client_id when editing
      if (project.client_id) {
        setSelectedClientId(project.client_id);
      }
    }
  }, [project]);

  useEffect(() => {
    if (mapPosition) {
      setFormData(prev => ({
        ...prev,
        latitude: mapPosition.lat,
        longitude: mapPosition.lng
      }));
    }
  }, [mapPosition]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateUrl = (url) => {
    if (!url) return true; // Empty URL is valid (optional)
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleGeocode = async () => {
    if (!formData.address) return;
    
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}`);
      if (!response.ok) throw new Error("Erreur réseau");
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        setMapPosition({ lat: newLat, lng: newLng });
        
        toast({
          title: "Adresse trouvée",
          description: "La position sur la carte a été mise à jour.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Adresse non trouvée",
          description: "Essayez de préciser l'adresse (ville, code postal).",
        });
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de contacter le service de géocodage.",
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.name) {
      setError("Le nom du projet est obligatoire.");
      setLoading(false);
      return;
    }

    if (formData.projectUrl && !validateUrl(formData.projectUrl)) {
      setError("Le format de l'URL est invalide. Assurez-vous d'inclure http:// ou https://");
      setLoading(false);
      return;
    }

    try {
      // Determine client_id: use selectedClientId (super_admin) or clientId prop (client user)
      const finalClientId = selectedClientId || clientId || null;

      const dataToSave = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        city: formData.city,
        address: formData.address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        start_date: formData.startDate || null,
        capacity: formData.capacity,
        description: formData.description,
        url_type: formData.urlType,
        project_url: formData.projectUrl,
        client_id: finalClientId,
        updated_at: new Date()
      };

      let result;
      if (project?.id) {
        result = await supabase
          .from('projects')
          .update(dataToSave)
          .eq('id', project.id);
      } else {
        result = await supabase
          .from('projects')
          .insert([dataToSave]);
      }

      if (result.error) throw result.error;

      toast({ title: "Succès", description: project?.id ? "Projet mis à jour." : "Nouveau projet créé." });
      onSuccess();
    } catch (err) {
      console.error("Error saving project:", err);
      setError(err.message || "Erreur lors de l'enregistrement du projet.");
      toast({ 
        variant: "destructive",
        title: "Erreur", 
        description: "Impossible d'enregistrer le projet." 
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full rounded-md border border-gray-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm py-2 px-3 transition-colors hover:border-gray-400 text-gray-900";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5 flex items-center";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center shadow-sm border border-red-100 mb-6">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Main Layout: Desktop 60/40, Mobile Stacked */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-grow">
        
        {/* Left Column: Form Fields (60% on desktop) */}
        <div className="w-full lg:w-[60%] space-y-5">
          
          {/* Project Name */}
          <div>
            <label className={labelClass}>
              Nom du projet <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`${inputClass} font-medium`}
              placeholder="Ex: Parc Éolien du Nord"
            />
          </div>

          {/* Client Selection (Super Admin only) */}
          {clients && clients.length > 0 && (
            <div>
              <label className={labelClass}>
                <Building className="w-4 h-4 mr-1.5 text-gray-500" /> Client
              </label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={inputClass}
              >
                <option value="">-- Sélectionner un client --</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <Zap className="w-4 h-4 mr-1.5 text-gray-500" /> Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Parc éolien</option>
                <option>Station solaire</option>
                <option>Méthanisation</option>
                <option>Consultation publique</option>
                <option>Centre de stockage</option>
                <option>Ligne électrique</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                <Flag className="w-4 h-4 mr-1.5 text-gray-500" /> Statut
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="en étude">En étude</option>
                <option value="en construction">En construction</option>
                <option value="en exploitation">En exploitation</option>
                <option value="consultation en cours">Consultation en cours</option>
              </select>
            </div>
          </div>

          {/* City & Capacity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <Building className="w-4 h-4 mr-1.5 text-gray-500" /> Ville
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ex: Paris"
              />
            </div>
            <div>
              <label className={labelClass}>Capacité</label>
              <input
                type="text"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="Ex: 12 MW"
                className={inputClass}
              />
            </div>
          </div>

          {/* Address Field Group - Moved here per request */}
          <div>
            <label className={labelClass}>
              <MapPin className="w-4 h-4 mr-1.5 text-gray-500" /> Adresse complète
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleGeocode())}
                placeholder="Ex: 10 Rue de la Paix, Paris"
                className={`${inputClass} flex-grow`}
              />
              <Button 
                type="button"
                onClick={handleGeocode}
                disabled={isGeocoding || !formData.address}
                className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200"
                title="Localiser sur la carte"
              >
                {isGeocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Localiser</span>
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Saisissez l'adresse et cliquez sur Localiser pour mettre à jour la carte.</p>
          </div>

           {/* Start Date */}
           <div>
             <label className={labelClass}>
               <Calendar className="w-4 h-4 mr-1.5 text-gray-500" /> Date de début
             </label>
             <input
               type="date"
               name="startDate"
               value={formData.startDate}
               onChange={handleChange}
               className={inputClass}
             />
          </div>

          {/* URL Field Group */}
          <div>
            <label className={labelClass}>
              <Globe className="w-4 h-4 mr-1.5 text-gray-500" /> URL du projet
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                name="urlType"
                value={formData.urlType}
                onChange={handleChange}
                className={`${inputClass} sm:w-1/3 bg-gray-50`}
              >
                <option>Website URL</option>
                <option>API URL</option>
                <option>Documentation URL</option>
                <option>GitHub URL</option>
                <option>Autre</option>
              </select>
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="url"
                  name="projectUrl"
                  value={formData.projectUrl}
                  onChange={handleChange}
                  className={`${inputClass} pl-10`}
                  placeholder="https://exemple.com"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>
              <AlignLeft className="w-4 h-4 mr-1.5 text-gray-500" /> Description
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className={inputClass}
              placeholder="Détails supplémentaires sur le projet..."
            />
          </div>
        </div>

        {/* Right Column: Map (40% on desktop) */}
        <div className="w-full lg:w-[40%] flex flex-col h-auto">
          <label className={`${labelClass} mb-2`}>
            Aperçu de la position (Cliquez pour ajuster)
          </label>
          
          <div className="h-[350px] lg:h-[450px] w-full rounded-lg overflow-hidden border border-gray-300 relative z-0 shadow-sm">
             <MapContainer 
                center={[formData.latitude || 46.2276, formData.longitude || 2.2137]} 
                zoom={6} 
                style={{ height: '100%', width: '100%' }}
             >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <LocationMarker position={mapPosition} setPosition={setMapPosition} />
             </MapContainer>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-3 bg-gray-50 p-3 rounded-md border border-gray-200">
             <div className="text-xs text-gray-500 font-mono">Lat: <span className="text-gray-900 font-semibold">{parseFloat(formData.latitude).toFixed(4)}</span></div>
             <div className="text-xs text-gray-500 font-mono">Long: <span className="text-gray-900 font-semibold">{parseFloat(formData.longitude).toFixed(4)}</span></div>
          </div>
          <p className="text-xs text-gray-400 mt-2 italic text-center">Vous pouvez aussi cliquer directement sur la carte pour définir la position.</p>
        </div>
      </div>

      {/* Footer: Action Buttons */}
      <div className="flex justify-end items-center gap-4 pt-6 mt-6 border-t border-gray-100">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={onCancel}
          className="px-6 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        >
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 font-medium shadow-md transition-all hover:shadow-lg"
        >
          {loading ? <span className="animate-spin mr-2">⏳</span> : <Save className="w-4 h-4 mr-2" />}
          {project?.id ? 'Enregistrer les modifications' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
