
import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Building2, Upload, Loader2, Save, X } from 'lucide-react';

const ClientProfile = () => {
  const { clientInfo, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    description: clientInfo?.description || '',
    contact_email: clientInfo?.contact_email || '',
    contact_phone: clientInfo?.contact_phone || '',
    logo_url: clientInfo?.logo_url || '',
    primary_color: clientInfo?.primary_color || '#3b82f6'
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Veuillez sélectionner une image.' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Erreur', description: 'L\'image ne doit pas dépasser 2MB.' });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientInfo.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));

      toast({ title: 'Logo uploadé', description: 'Cliquez sur Enregistrer pour sauvegarder.' });
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        variant: 'destructive',
        title: 'Erreur d\'upload',
        description: 'Impossible d\'uploader le logo. Vérifiez que le bucket "client-assets" existe dans Supabase Storage.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          description: formData.description,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          logo_url: formData.logo_url,
          primary_color: formData.primary_color,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientInfo.id);

      if (error) throw error;

      // Refresh profile to update clientInfo
      await refreshProfile();

      toast({ title: 'Profil mis à jour', description: 'Vos informations ont été enregistrées.' });
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving profile:', err);
      toast({ variant: 'destructive', title: 'Erreur', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      description: clientInfo?.description || '',
      contact_email: clientInfo?.contact_email || '',
      contact_phone: clientInfo?.contact_phone || '',
      logo_url: clientInfo?.logo_url || '',
      primary_color: clientInfo?.primary_color || '#3b82f6'
    });
    setIsEditing(false);
  };

  if (!clientInfo) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Logo Display/Upload */}
          <div className="relative group">
            {formData.logo_url ? (
              <img
                src={formData.logo_url}
                alt={clientInfo.name}
                className="w-16 h-16 rounded-xl object-cover border-2 border-gray-100"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: formData.primary_color }}
              >
                <Building2 className="w-8 h-8 text-white" />
              </div>
            )}

            {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-white" />
                )}
              </label>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900">{clientInfo.name}</h2>
            <p className="text-sm text-gray-500">Votre profil client</p>
          </div>
        </div>

        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="ghost" size="sm" disabled={isLoading}>
              <X className="w-4 h-4 mr-1" />
              Annuler
            </Button>
            <Button onClick={handleSubmit} size="sm" className="bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Enregistrer
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Brève description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email de contact
              </label>
              <input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="contact@votreentreprise.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone
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
              Couleur principale
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border-0"
              />
              <input
                type="text"
                value={formData.primary_color}
                onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                className="w-28 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Pour changer le logo, survolez l'image et cliquez sur l'icône d'upload. Max 2MB.
          </p>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {clientInfo.description && (
            <div className="md:col-span-2">
              <span className="text-gray-500">Description:</span>
              <p className="text-gray-900">{clientInfo.description}</p>
            </div>
          )}
          {clientInfo.contact_email && (
            <div>
              <span className="text-gray-500">Email:</span>
              <p className="text-gray-900">{clientInfo.contact_email}</p>
            </div>
          )}
          {clientInfo.contact_phone && (
            <div>
              <span className="text-gray-500">Téléphone:</span>
              <p className="text-gray-900">{clientInfo.contact_phone}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ClientProfile;
