
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import {
  AlertCircle, Calendar, MapPin, Save, Zap, Building, Flag, AlignLeft,
  Globe, Link as LinkIcon, Loader2, User, Image, Hash,
  Map as MapIcon, Home, X, Plus
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ENERGY_CATEGORIES, POWER_UNITS, EQUIVALENT_TYPES } from '@/utils/mapUtils.jsx';

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

// Tag input component for arrays (communes, intercommunalités)
const TagInput = ({ value = [], onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
        setInputValue('');
      }
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium pl-3 pr-2 py-1.5 rounded-lg border border-indigo-100"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:bg-indigo-100 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm py-2.5 px-3.5 transition-all hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
        />
        <Button
          type="button"
          onClick={() => {
            const trimmed = inputValue.trim();
            if (trimmed && !value.includes(trimmed)) {
              onChange([...value, trimmed]);
              setInputValue('');
            }
          }}
          className="bg-indigo-600 text-white hover:bg-indigo-700 px-4"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const ProjectForm = ({ project, onSuccess, onCancel, clientId, clients }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selected client for super_admin
  const [selectedClientId, setSelectedClientId] = useState(project?.client_id || clientId || '');

  // Form State with new fields
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    operator: '',
    poiLogoUrl: '',
    energyCategory: '',
    energySubtype: '',
    status: 'en projet',
    commissioningYear: '',
    // Geography
    city: '',
    latitude: 46.2276,
    longitude: 2.2137,
    communes: [],
    intercommunalites: [],
    region: '',
    // Power
    nominalPower: '',
    nominalPowerUnit: 'MW',
    actualPower: '',
    actualPowerUnit: 'MW',
    equivalentDisplay: 'foyers',
    // Live Data
    liveDataUrl: '',
    liveDataPath: 'current_power',
    // Other
    description: '',
    urlType: 'Website URL',
    projectUrl: ''
  });

  // Map position state
  const [mapPosition, setMapPosition] = useState(null);

  // Get available subtypes based on selected category
  const availableSubtypes = formData.energyCategory
    ? ENERGY_CATEGORIES[formData.energyCategory]?.subtypes || []
    : [];

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || '',
        displayName: project.display_name || '',
        operator: project.operator || '',
        poiLogoUrl: project.poi_logo_url || '',
        energyCategory: project.energy_category || '',
        energySubtype: project.energy_subtype || '',
        status: project.status || 'en projet',
        commissioningYear: project.commissioning_year || '',
        city: project.city || '',
        latitude: project.latitude || 46.2276,
        longitude: project.longitude || 2.2137,
        communes: project.communes || [],
        intercommunalites: project.intercommunalites || [],
        region: project.region || '',
        nominalPower: project.nominal_power || '',
        nominalPowerUnit: project.nominal_power_unit || 'MW',
        actualPower: project.actual_power || '',
        actualPowerUnit: project.actual_power_unit || 'MW',
        equivalentDisplay: project.equivalent_display || 'foyers',
        liveDataUrl: project.live_data_url || '',
        liveDataPath: project.live_data_path || 'current_power',
        description: project.description || '',
        urlType: project.url_type || 'Website URL',
        projectUrl: project.project_url || ''
      });
      if (project.latitude && project.longitude) {
        setMapPosition({ lat: project.latitude, lng: project.longitude });
      }
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

  // Reset subtype when category changes
  useEffect(() => {
    if (formData.energyCategory && availableSubtypes.length > 0) {
      const currentSubtypeValid = availableSubtypes.some(s => s.value === formData.energySubtype);
      if (!currentSubtypeValid) {
        setFormData(prev => ({ ...prev, energySubtype: '' }));
      }
    }
  }, [formData.energyCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'latitude' || name === 'longitude') {
      const lat = parseFloat(name === 'latitude' ? value : formData.latitude);
      const lng = parseFloat(name === 'longitude' ? value : formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setMapPosition({ lat, lng });
      }
    }
  };

  const validateUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
      const finalClientId = selectedClientId || clientId || null;

      const dataToSave = {
        name: formData.name,
        display_name: formData.displayName || null,
        operator: formData.operator || null,
        poi_logo_url: formData.poiLogoUrl || null,
        energy_category: formData.energyCategory || null,
        energy_subtype: formData.energySubtype || null,
        // Champ "type" requis par Supabase - utilise subtype ou category (gere les chaines vides)
        type: (formData.energySubtype && formData.energySubtype.trim()) ||
              (formData.energyCategory && formData.energyCategory.trim()) ||
              'Autre',
        status: formData.status,
        commissioning_year: formData.commissioningYear ? parseInt(formData.commissioningYear) : null,
        city: formData.city,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        communes: formData.communes,
        intercommunalites: formData.intercommunalites,
        region: formData.region || null,
        nominal_power: formData.nominalPower ? parseFloat(formData.nominalPower) : null,
        nominal_power_unit: formData.nominalPowerUnit,
        actual_power: formData.actualPower ? parseFloat(formData.actualPower) : null,
        actual_power_unit: formData.actualPowerUnit,
        equivalent_display: formData.equivalentDisplay,
        live_data_url: formData.liveDataUrl || null,
        live_data_path: formData.liveDataPath || 'current_power',
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

  const inputClass = "block w-full rounded-lg border border-gray-200 bg-white shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm py-2.5 px-3.5 transition-all hover:border-gray-300 text-gray-900 placeholder:text-gray-400";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5 flex items-center";
  const sectionClass = "bg-white rounded-xl border border-gray-100 p-5 space-y-5 shadow-sm";
  const sectionTitleClass = "text-xs font-semibold text-indigo-600 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-2";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-gray-50/50">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-center border border-red-100 mb-6">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 flex-grow overflow-auto pb-4">

        {/* Left Column: Form Fields */}
        <div className="w-full lg:w-[60%] space-y-6">

          {/* Section: Identification */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <Hash className="w-4 h-4" /> Identification
            </h3>

            <div>
              <label className={labelClass}>
                Nom du POI <span className="text-red-500 ml-1">*</span>
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

            <div>
              <label className={labelClass}>
                <User className="w-4 h-4 mr-1.5 text-gray-500" /> Exploitant / Propriétaire
              </label>
              <input
                type="text"
                name="operator"
                value={formData.operator}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ex: EDF Renouvelables"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <Image className="w-4 h-4 mr-1.5 text-gray-500" /> Logo du POI (URL)
                </label>
                <input
                  type="url"
                  name="poiLogoUrl"
                  value={formData.poiLogoUrl}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className={labelClass}>
                  Nom en lettres (affichage)
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ex: PARC ÉOLIEN DU NORD"
                />
              </div>
            </div>

            {/* Client Selection */}
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

            <div>
              <label className={labelClass}>
                <Globe className="w-4 h-4 mr-1.5 text-gray-500" /> Site web (lien direct)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  name="urlType"
                  value={formData.urlType}
                  onChange={handleChange}
                  className={`${inputClass} sm:w-1/3 bg-gray-50`}
                >
                  <option>Website URL</option>
                  <option>Documentation URL</option>
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
          </div>

          {/* Section: Type d'énergie */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <Zap className="w-4 h-4" /> Type d'énergie
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Catégorie d'énergie</label>
                <select
                  name="energyCategory"
                  value={formData.energyCategory}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="">-- Sélectionner --</option>
                  {Object.entries(ENERGY_CATEGORIES).map(([key, cat]) => (
                    <option key={key} value={key}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Sous-type</label>
                <select
                  name="energySubtype"
                  value={formData.energySubtype}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!availableSubtypes.length}
                >
                  <option value="">-- Aucun --</option>
                  {availableSubtypes.map((sub) => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <option value="en projet">En projet</option>
                  <option value="en exploitation">En exploitation</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>
                  <Calendar className="w-4 h-4 mr-1.5 text-gray-500" /> Année de mise en service
                </label>
                <input
                  type="number"
                  name="commissioningYear"
                  value={formData.commissioningYear}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ex: 2024"
                  min="1900"
                  max="2100"
                />
              </div>
            </div>
          </div>

          {/* Section: Puissance */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <Zap className="w-4 h-4" /> Puissance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Puissance nominale</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="nominalPower"
                    value={formData.nominalPower}
                    onChange={handleChange}
                    className={`${inputClass} flex-grow`}
                    placeholder="Ex: 12"
                    step="0.01"
                  />
                  <select
                    name="nominalPowerUnit"
                    value={formData.nominalPowerUnit}
                    onChange={handleChange}
                    className={`${inputClass} w-24`}
                  >
                    {POWER_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Puissance en direct</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="actualPower"
                    value={formData.actualPower}
                    onChange={handleChange}
                    className={`${inputClass} flex-grow`}
                    placeholder="Ex: 10.5"
                    step="0.01"
                  />
                  <select
                    name="actualPowerUnit"
                    value={formData.actualPowerUnit}
                    onChange={handleChange}
                    className={`${inputClass} w-24`}
                  >
                    {POWER_UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Équivalent à afficher</label>
              <div className="grid grid-cols-3 gap-2">
                {EQUIVALENT_TYPES.map(eq => (
                  <label
                    key={eq.value}
                    className={`flex items-center justify-center gap-2 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                      formData.equivalentDisplay === eq.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="equivalentDisplay"
                      value={eq.value}
                      checked={formData.equivalentDisplay === eq.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-sm font-medium">{eq.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Live Data from External API */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-gray-700">Données temps réel (optionnel)</span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={labelClass}>
                    <Globe className="w-4 h-4 mr-1.5 text-gray-500" /> URL API JSON
                  </label>
                  <input
                    type="url"
                    name="liveDataUrl"
                    value={formData.liveDataUrl}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://api-client.com/project/123/power"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    URL qui retourne les données en temps réel au format JSON
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Chemin JSON</label>
                  <input
                    type="text"
                    name="liveDataPath"
                    value={formData.liveDataPath}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="current_power"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Chemin vers la valeur dans le JSON (ex: "current_power" ou "data.measurements.power")
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Géographie */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <MapIcon className="w-4 h-4" /> Géographie
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-500" /> Latitude
                </label>
                <input
                  type="number"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ex: 48.8566"
                  step="0.00001"
                />
              </div>
              <div>
                <label className={labelClass}>
                  <MapPin className="w-4 h-4 mr-1.5 text-gray-500" /> Longitude
                </label>
                <input
                  type="number"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ex: 2.3522"
                  step="0.00001"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                <Building className="w-4 h-4 mr-1.5 text-gray-500" /> Ville principale
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
              <label className={labelClass}>
                <MapPin className="w-4 h-4 mr-1.5 text-gray-500" /> Région
              </label>
              <input
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ex: Île-de-France"
              />
            </div>

            <div>
              <label className={labelClass}>
                <Home className="w-4 h-4 mr-1.5 text-gray-500" /> Communes concernées
              </label>
              <TagInput
                value={formData.communes}
                onChange={(newValue) => setFormData(prev => ({ ...prev, communes: newValue }))}
                placeholder="Ajouter une commune (Entrée pour valider)"
              />
            </div>

            <div>
              <label className={labelClass}>
                <Building className="w-4 h-4 mr-1.5 text-gray-500" /> Intercommunalités
              </label>
              <TagInput
                value={formData.intercommunalites}
                onChange={(newValue) => setFormData(prev => ({ ...prev, intercommunalites: newValue }))}
                placeholder="Ajouter une intercommunalité (Entrée pour valider)"
              />
            </div>
          </div>

          {/* Section: Description */}
          <div className={sectionClass}>
            <h3 className={sectionTitleClass}>
              <AlignLeft className="w-4 h-4" /> Description
            </h3>
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

        {/* Right Column: Map */}
        <div className="w-full lg:w-[40%] flex flex-col h-auto lg:sticky lg:top-0">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h3 className="text-xs font-semibold text-indigo-600 uppercase tracking-wider pb-3 border-b border-gray-100 flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4" /> Position sur la carte
            </h3>

            <div className="h-[300px] lg:h-[380px] w-full rounded-xl overflow-hidden border border-gray-200 relative z-0">
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

          <div className="grid grid-cols-2 gap-3 mt-3">
             <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
               <span className="text-xs text-gray-500 block">Latitude</span>
               <span className="text-sm font-semibold text-gray-900">{parseFloat(formData.latitude).toFixed(5)}</span>
             </div>
             <div className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
               <span className="text-xs text-gray-500 block">Longitude</span>
               <span className="text-sm font-semibold text-gray-900">{parseFloat(formData.longitude).toFixed(5)}</span>
             </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Cliquez sur la carte pour définir la position</p>
          </div>
        </div>
      </div>

      {/* Footer: Action Buttons */}
      <div className="flex justify-end items-center gap-3 pt-6 mt-6 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="px-6 text-gray-600 hover:bg-gray-50 border-gray-200"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 font-medium shadow-sm transition-all hover:shadow-md disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {project?.id ? 'Enregistrer' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  );
};

export default ProjectForm;
