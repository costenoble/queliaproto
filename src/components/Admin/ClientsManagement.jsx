
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Plus, Edit2, Trash2, Users, MapPin, Loader2, Upload } from 'lucide-react';

const ClientsManagement = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientStats, setClientStats] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    logo_url: '',
    primary_color: '#3b82f6'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e, clientId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner une image.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'L\'image ne doit pas dépasser 2MB.' });
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('client-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast({ title: 'Logo uploadé', description: 'L\'image a été téléchargée.' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'upload',
        description: 'Vérifiez que le bucket "client-assets" existe dans Supabase Storage.'
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);

      // Fetch stats for each client (number of projects)
      const stats = {};
      for (const client of data || []) {
        const { count } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);
        stats[client.id] = count || 0;
      }
      setClientStats(stats);
    } catch (err) {
      console.error('Error fetching clients:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: 'Impossible de charger les clients.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleCreate = () => {
    setSelectedClient(null);
    setFormData({
      name: '',
      slug: '',
      contact_email: '',
      contact_phone: '',
      description: '',
      logo_url: '',
      primary_color: '#3b82f6'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name || '',
      slug: client.slug || '',
      contact_email: client.contact_email || '',
      contact_phone: client.contact_phone || '',
      description: client.description || '',
      logo_url: client.logo_url || '',
      primary_color: client.primary_color || '#3b82f6'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (selectedClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedClient.id);

        if (error) throw error;
        toast({ title: 'Client mis à jour', description: 'Les informations ont été enregistrées.' });
      } else {
        // Create new client
        const { error: clientError } = await supabase
          .from('clients')
          .insert([formData]);

        if (clientError) throw clientError;
        toast({ title: 'Client créé', description: 'Le nouveau client a été ajouté.' });
      }

      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error('Error saving client:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (client) => {
    if (!confirm(`Supprimer le client "${client.name}" ? Cette action est irr\u00e9versible.`)) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;
      toast({ title: 'Client supprim\u00e9', description: 'Le client a \u00e9t\u00e9 supprim\u00e9.' });
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestion des Clients</h2>
          <p className="text-sm text-gray-500">{clients.length} client(s) enregistr\u00e9(s)</p>
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Client
        </Button>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.map((client) => (
          <div
            key={client.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {client.logo_url ? (
                  <img src={client.logo_url} alt={client.name} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: client.primary_color || '#3b82f6' }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{client.name}</h3>
                  <p className="text-xs text-gray-500">{client.slug}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(client)}
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(client)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {client.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{client.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{clientStats[client.id] || 0} POI</span>
              </div>
              {client.contact_email && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span className="truncate max-w-[120px]">{client.contact_email}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {clients.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Aucun client pour le moment.</p>
            <Button onClick={handleCreate} variant="link" className="mt-2">
              Cr\u00e9er le premier client
            </Button>
          </div>
        )}
      </div>

      {/* Modal Create/Edit Client */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du client *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: EDF Renouvelables"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                placeholder="edf-renouvelables"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="contact@client.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  T\u00e9l\u00e9phone
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="01 23 45 67 89"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Br\u00e8ve description du client..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Logo
              </label>
              <div className="flex items-center gap-3">
                {/* Logo preview */}
                {formData.logo_url ? (
                  <img
                    src={formData.logo_url}
                    alt="Logo"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: formData.primary_color }}
                  >
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                )}

                {/* Upload button */}
                <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, selectedClient?.id)}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                  {isUploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {isUploadingLogo ? 'Upload...' : 'Choisir une image'}
                  </span>
                </label>

                {/* Clear button */}
                {formData.logo_url && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Max 2MB. Formats: JPG, PNG, GIF, WebP</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur principale
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primary_color}
                  onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  selectedClient ? 'Enregistrer' : 'Créer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsManagement;
