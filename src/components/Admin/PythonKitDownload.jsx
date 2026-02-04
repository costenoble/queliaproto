import React, { useState } from 'react';
import { Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PythonKitDownload = ({ projectId, projectName, apiKey }) => {
  // Configuration Supabase
  const SUPABASE_URL = 'https://msqisigttxosvnxfhfdn.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcWlzaWd0dHhvc3ZueGZoZmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MTM2NDYsImV4cCI6MjA4NDM4OTY0Nn0.Idzca71FzW4SVlKlqHOsbh3JvMfzYH-jpCJP22rzSQ8';

  const generateEnvFile = () => {
    return `# Configuration pour ${projectName}
# Projet ID: ${projectId}

# URL et clés Supabase de Quelia
URL=${SUPABASE_URL}/rest/v1/rpc/insert_live_data
SUPABASE_KEY=${SUPABASE_ANON_KEY}

# Clé API de votre projet
API_KEY=${apiKey}

# Configuration des données à envoyer
# IMPORTANT: Modifiez ces valeurs selon votre source de données
UNITE=kW
INTERVALLE=60

# SOURCE DE DONNÉES
# Décommentez et configurez UNE SEULE des options ci-dessous:

# Option 1: Fichier CSV
# SOURCE_TYPE=csv
# SOURCE_PATH=data.csv
# COLONNE_VALEUR=power

# Option 2: Fichier texte simple
# SOURCE_TYPE=txt
# SOURCE_PATH=data.txt

# Option 3: API REST
# SOURCE_TYPE=api
# SOURCE_URL=http://localhost:8080/api/current-power
# JSON_PATH=data.value

# Option 4: Base de données PostgreSQL
# SOURCE_TYPE=postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=monitoring
# DB_USER=user
# DB_PASSWORD=password
# DB_QUERY=SELECT value FROM measurements ORDER BY timestamp DESC LIMIT 1

# Option 5: Modbus TCP
# SOURCE_TYPE=modbus
# MODBUS_HOST=192.168.1.100
# MODBUS_PORT=502
# MODBUS_REGISTER=40001
# MODBUS_UNIT=1

# Option 6: Données aléatoires (pour tests uniquement)
SOURCE_TYPE=random
MIN_VALUE=50
MAX_VALUE=200
`;
  };

  const generatePythonScript = () => {
    return `#!/usr/bin/env python3
"""
Script d'envoi de données temps réel vers Quelia
Projet: ${projectName}
Projet ID: ${projectId}

Installation:
    pip install -r requirements.txt

Configuration:
    Modifiez le fichier .env pour configurer votre source de données

Utilisation:
    python envoi_donnees.py
"""

import os
import time
import requests
from datetime import datetime
from dotenv import load_dotenv

# Chargement des variables d'environnement
load_dotenv()

# Configuration depuis .env
URL = os.getenv('URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')
API_KEY = os.getenv('API_KEY')
UNITE = os.getenv('UNITE', 'kW')
INTERVALLE = int(os.getenv('INTERVALLE', 60))
SOURCE_TYPE = os.getenv('SOURCE_TYPE', 'random')

# Validation de la configuration
if not all([URL, SUPABASE_KEY, API_KEY]):
    print("❌ ERREUR: Configuration incomplète dans .env")
    print("   Vérifiez que URL, SUPABASE_KEY et API_KEY sont définis")
    exit(1)

print(f"✅ Configuration chargée:")
print(f"   - Projet: ${projectName}")
print(f"   - Source: {SOURCE_TYPE}")
print(f"   - Unité: {UNITE}")
print(f"   - Intervalle: {INTERVALLE}s")
print()


def lire_valeur():
    """
    Lit la valeur depuis la source configurée
    Retourne: float ou None en cas d'erreur
    """
    try:
        if SOURCE_TYPE == 'random':
            # Mode test: génère une valeur aléatoire
            import random
            min_val = float(os.getenv('MIN_VALUE', 50))
            max_val = float(os.getenv('MAX_VALUE', 200))
            return round(random.uniform(min_val, max_val), 2)

        elif SOURCE_TYPE == 'csv':
            # Lire depuis un fichier CSV
            import pandas as pd
            csv_path = os.getenv('SOURCE_PATH', 'data.csv')
            colonne = os.getenv('COLONNE_VALEUR', 'value')
            df = pd.read_csv(csv_path)
            return float(df[colonne].iloc[-1])

        elif SOURCE_TYPE == 'txt':
            # Lire depuis un fichier texte simple
            txt_path = os.getenv('SOURCE_PATH', 'data.txt')
            with open(txt_path, 'r') as f:
                return float(f.read().strip())

        elif SOURCE_TYPE == 'api':
            # Lire depuis une API REST
            api_url = os.getenv('SOURCE_URL')
            json_path = os.getenv('JSON_PATH', 'value')
            response = requests.get(api_url, timeout=10)
            response.raise_for_status()
            data = response.json()

            # Navigation dans le JSON avec le path
            for key in json_path.split('.'):
                data = data[key]
            return float(data)

        elif SOURCE_TYPE == 'postgres':
            # Lire depuis PostgreSQL
            import psycopg2
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST'),
                port=os.getenv('DB_PORT'),
                database=os.getenv('DB_NAME'),
                user=os.getenv('DB_USER'),
                password=os.getenv('DB_PASSWORD')
            )
            cursor = conn.cursor()
            cursor.execute(os.getenv('DB_QUERY'))
            result = cursor.fetchone()
            conn.close()
            return float(result[0]) if result else None

        elif SOURCE_TYPE == 'modbus':
            # Lire depuis Modbus TCP
            from pymodbus.client import ModbusTcpClient
            client = ModbusTcpClient(
                os.getenv('MODBUS_HOST'),
                port=int(os.getenv('MODBUS_PORT', 502))
            )
            client.connect()
            register = int(os.getenv('MODBUS_REGISTER', 40001))
            unit = int(os.getenv('MODBUS_UNIT', 1))
            result = client.read_holding_registers(register, 1, slave=unit)
            client.close()
            return float(result.registers[0]) if result else None

        else:
            print(f"❌ Type de source inconnu: {SOURCE_TYPE}")
            return None

    except Exception as e:
        print(f"❌ Erreur lecture valeur: {e}")
        return None


def envoyer_donnee(valeur):
    """
    Envoie la valeur à Quelia
    Retourne: True si succès, False sinon
    """
    try:
        payload = {
            "p_api_key": API_KEY,
            "p_value": float(valeur),
            "p_unit": UNITE
        }

        headers = {
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json"
        }

        response = requests.post(
            URL,
            json=payload,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        if response.json().get('success'):
            print(f"✅ [{datetime.now().strftime('%H:%M:%S')}] Envoyé: {valeur} {UNITE}")
            return True
        else:
            print(f"❌ Échec: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Erreur réseau: {e}")
        return False
    except Exception as e:
        print(f"❌ Erreur envoi: {e}")
        return False


def main():
    """Boucle principale"""
    print(f"🚀 Démarrage de l'envoi de données vers Quelia")
    print(f"   Appuyez sur Ctrl+C pour arrêter")
    print()

    erreurs_consecutives = 0
    max_erreurs = 5

    while True:
        try:
            # Lire la valeur
            valeur = lire_valeur()

            if valeur is not None:
                # Envoyer à Quelia
                succes = envoyer_donnee(valeur)

                if succes:
                    erreurs_consecutives = 0
                else:
                    erreurs_consecutives += 1
            else:
                print("⚠️  Aucune valeur lue")
                erreurs_consecutives += 1

            # Arrêt si trop d'erreurs consécutives
            if erreurs_consecutives >= max_erreurs:
                print(f"❌ ERREUR: {max_erreurs} échecs consécutifs, arrêt du script")
                break

            # Attendre avant le prochain envoi
            time.sleep(INTERVALLE)

        except KeyboardInterrupt:
            print("\\n⏹️  Arrêt demandé par l'utilisateur")
            break
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
            erreurs_consecutives += 1
            time.sleep(INTERVALLE)

    print("👋 Script terminé")


if __name__ == "__main__":
    main()
`;
  };

  const generateRequirementsTxt = () => {
    return `# Dépendances Python pour l'envoi de données à Quelia
requests>=2.31.0
python-dotenv>=1.0.0

# Optionnel: selon votre source de données
# pandas>=2.0.0          # Pour lire des CSV
# psycopg2-binary>=2.9.0 # Pour PostgreSQL
# pymodbus>=3.5.0        # Pour Modbus
`;
  };

  const generateReadme = () => {
    return `# Kit Python - ${projectName}

Script d'envoi automatique de données temps réel vers Quelia.

## 📦 Installation

### 1. Installer Python
- Windows: [python.org](https://www.python.org/downloads/)
- Linux: \`sudo apt install python3 python3-pip\`

### 2. Installer les dépendances
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 3. Configurer le fichier .env
Modifiez le fichier \`.env\` pour définir votre source de données.

**Options disponibles:**
- \`random\`: Données aléatoires (pour tests)
- \`csv\`: Lire depuis un fichier CSV
- \`txt\`: Lire depuis un fichier texte
- \`api\`: Interroger une API REST
- \`postgres\`: Lire depuis PostgreSQL
- \`modbus\`: Lire depuis Modbus TCP

## 🚀 Utilisation

### Test rapide (mode aléatoire)
\`\`\`bash
python envoi_donnees.py
\`\`\`

### Production
1. Configurez \`SOURCE_TYPE\` dans \`.env\`
2. Remplissez les paramètres de votre source
3. Lancez le script

## 🔄 Automatisation

### Linux (systemd)
Créez \`/etc/systemd/system/quelia-${projectId}.service\`:
\`\`\`ini
[Unit]
Description=Quelia Data Sender - ${projectName}
After=network.target

[Service]
Type=simple
User=votre-utilisateur
WorkingDirectory=/chemin/vers/le/script
ExecStart=/usr/bin/python3 envoi_donnees.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
\`\`\`

Puis:
\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl enable quelia-${projectId}
sudo systemctl start quelia-${projectId}
\`\`\`

### Windows (Tâche planifiée)
1. Ouvrir "Planificateur de tâches"
2. Créer une tâche de base
3. Déclencheur: "Au démarrage"
4. Action: Démarrer \`python.exe\` avec \`envoi_donnees.py\`

## 📊 Vérification

Vos données apparaîtront en temps réel sur votre tableau de bord Quelia avec le badge **PUSH**.

## 🆘 Support

En cas de problème, vérifiez:
1. Le script affiche des ✅ (succès) ou ❌ (erreur)
2. Votre configuration \`.env\` est correcte
3. Votre pare-feu autorise les connexions sortantes HTTPS

---
Généré automatiquement par Quelia pour le projet: ${projectName}
`;
  };

  const [showFiles, setShowFiles] = useState(false);

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadAll = () => {
    downloadFile('envoi_donnees.py', generatePythonScript());
    downloadFile('.env', generateEnvFile());
    downloadFile('requirements.txt', generateRequirementsTxt());
    downloadFile('README.md', generateReadme());
  };

  if (!apiKey) {
    return null;
  }

  const files = [
    { name: 'envoi_donnees.py', label: 'Script principal', generator: generatePythonScript },
    { name: '.env', label: 'Configuration', generator: generateEnvFile },
    { name: 'requirements.txt', label: 'Dépendances', generator: generateRequirementsTxt },
    { name: 'README.md', label: 'Instructions', generator: generateReadme },
  ];

  return (
    <div className="space-y-1">
      {/* Bouton principal : télécharge tout */}
      <Button
        onClick={downloadAll}
        variant="outline"
        size="sm"
        className="w-full flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
      >
        <Download className="w-4 h-4" />
        Télécharger kit Python (4 fichiers)
      </Button>

      {/* Détail des fichiers individuels */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-gray-500 hover:text-gray-700 p-1"
        onClick={() => setShowFiles(!showFiles)}
      >
        {showFiles ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
        {showFiles ? 'Masquer' : 'Détail des fichiers'}
      </Button>

      {showFiles && (
        <div className="border border-gray-100 rounded-lg overflow-hidden">
          {files.map((file) => (
            <div key={file.name} className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-mono text-gray-700">{file.name}</span>
                <span className="text-[10px] text-gray-400">— {file.label}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                onClick={() => downloadFile(file.name, file.generator())}
              >
                <Download className="w-3 h-3 mr-1" />
                DL
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PythonKitDownload;
