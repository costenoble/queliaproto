import React, { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PowerShellScriptDisplay = ({ projectId, apiKey }) => {
  const [copied, setCopied] = useState(false);
  const [showScript, setShowScript] = useState(false);

  // Configuration Supabase (à adapter selon ton environnement)
  const SUPABASE_URL = 'https://msqisigttxosvnxfhfdn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcWlzaWd0dHhvc3ZueGZoZmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MTM2NDYsImV4cCI6MjA4NDM4OTY0Nn0.Idzca71FzW4SVlKlqHOsbh3JvMfzYH-jpCJP22rzSQ8';

  const generatePowerShellScript = () => {
    return `# Script PowerShell pour envoyer des données temps réel à Quelia
# Projet ID: ${projectId}
#
# INSTRUCTIONS:
# 1. Remplacer 123.7 par votre valeur réelle
# 2. Remplacer "kW" par votre unité (kW, MW, m³/h, etc.)
# 3. Exécuter ce script dans PowerShell

Invoke-RestMethod \`
  -Uri "${SUPABASE_URL}/rest/v1/rpc/insert_live_data" \`
  -Method POST \`
  -Headers @{
    "apikey" = "${SUPABASE_ANON_KEY}"
    "Content-Type" = "application/json"
  } \`
  -Body '{"p_api_key":"${apiKey}","p_value":123.7,"p_unit":"kW"}'

# Si la commande réussit, vous verrez: {"success":true}
Write-Host "✅ Données envoyées avec succès!" -ForegroundColor Green`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatePowerShellScript());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  if (!apiKey) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Bouton pour afficher/masquer le script */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowScript(!showScript)}
        className="w-full flex items-center justify-center gap-2"
      >
        <Terminal className="w-4 h-4" />
        {showScript ? 'Masquer' : 'Voir'} script PowerShell
      </Button>

      {/* Script affiché */}
      {showScript && (
        <div className="relative">
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
            <pre className="whitespace-pre-wrap break-all">
              {generatePowerShellScript()}
            </pre>
          </div>

          {/* Bouton Copier */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copié !
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copier
              </>
            )}
          </Button>
        </div>
      )}

      {/* Instructions supplémentaires */}
      {showScript && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="font-medium text-blue-900 mb-1">💡 Comment utiliser ce script :</p>
          <ol className="text-blue-800 space-y-1 ml-4 list-decimal">
            <li>Copier le script avec le bouton ci-dessus</li>
            <li>Ouvrir PowerShell sur le serveur du client</li>
            <li>Coller et modifier les valeurs (123.7, "kW")</li>
            <li>Appuyer sur Entrée pour envoyer</li>
          </ol>
          <p className="text-blue-700 mt-2 text-xs">
            ⚡ Pour automatiser, ce script peut être intégré dans une tâche planifiée Windows ou un script de monitoring.
          </p>
        </div>
      )}
    </div>
  );
};

export default PowerShellScriptDisplay;
