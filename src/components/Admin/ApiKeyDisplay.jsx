import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, Key, Check } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import PowerShellScriptDisplay from './PowerShellScriptDisplay';
import PythonKitDownload from './PythonKitDownload';

const ApiKeyDisplay = ({ projectId, projectName }) => {
  const [apiKey, setApiKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApiKey();
  }, [projectId]);

  const fetchApiKey = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('api_key, is_active, created_at')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur:', error);
        return;
      }

      setApiKey(data?.api_key || null);
    } catch (err) {
      console.error('Erreur fetch API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('generate_api_key');
      
      if (error) throw error;

      const newKey = data;

      const { error: insertError } = await supabase
        .from('api_keys')
        .insert({
          project_id: projectId,
          api_key: newKey,
          name: 'Cle ' + projectName,
          is_active: true
        });

      if (insertError) throw insertError;

      setApiKey(newKey);
      toast({
        title: "Clé API générée",
        description: "La clé API a été créée avec succès."
      });
    } catch (err) {
      console.error('Erreur génération:', err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de générer la clé API."
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      toast({
        title: "Copié !",
        description: "Clé API copiée dans le presse-papier."
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const maskKey = (key) => {
    if (!key) return '';
    const dots = '•'.repeat(20);
    return key.substring(0, 12) + dots + key.substring(key.length - 8);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Key className="w-4 h-4 animate-pulse" />
        <span>Chargement...</span>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <Button
        onClick={generateApiKey}
        size="sm"
        variant="outline"
        className="text-xs"
      >
        <Key className="w-3 h-3 mr-1" />
        Générer clé
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Clé API */}
      <div className="flex items-center gap-2">
        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
          {showKey ? apiKey : maskKey(apiKey)}
        </code>

        <Button
          onClick={() => setShowKey(!showKey)}
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          title={showKey ? "Masquer" : "Afficher"}
        >
          {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </Button>

        <Button
          onClick={copyToClipboard}
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          title="Copier"
        >
          {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
        </Button>
      </div>

      {/* Script PowerShell (test rapide) */}
      <PowerShellScriptDisplay projectId={projectId} apiKey={apiKey} />

      {/* Kit Python (automatisation) */}
      <PythonKitDownload projectId={projectId} projectName={projectName} apiKey={apiKey} />
    </div>
  );
};

export default ApiKeyDisplay;
