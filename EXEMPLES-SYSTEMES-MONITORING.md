# Exemples pour les systèmes de monitoring courants

Ce document liste les configurations pour les systèmes de monitoring les plus courants dans le domaine de l'énergie renouvelable.

---

## 🌞 Solaire

### SolarEdge
**API Monitoring Portal**
- URL : `https://monitoringapi.solaredge.com/site/{siteId}/currentPowerFlow.json?api_key={YOUR_KEY}`
- Chemin JSON : `siteCurrentPowerFlow.LOAD.currentPower`
- Auth : API Key dans URL
- Doc : https://knowledge-center.solaredge.com/sites/kc/files/se_monitoring_api.pdf

### SMA Sunny Portal
**API WebConnect**
- URL : `http://[IP_ONDULEUR]/dyn/getValues.json?sid={SESSION_ID}`
- Chemin JSON : `result.SPOT_PACTOT.1`
- Auth : Session ID

### Huawei FusionSolar
**API OpenAPI**
- URL : `https://eu5.fusionsolar.huawei.com/thirdData/getStationRealKpi`
- Chemin JSON : `data.dataItemMap.real_health_state`
- Auth : Bearer Token

---

## 💨 Éolien

### SCADA GE
**API HistorianDataAccess**
- URL : Custom selon installation
- Format : Généralement OPC-UA ou REST propriétaire
- Contact : Votre intégrateur GE

### Siemens SCADA
**API WinCC OA**
- URL : `https://[SCADA_IP]/api/datapoints/{pointname}/value`
- Chemin JSON : `value`
- Auth : Basic Auth ou API Token

### Vestas
**Vestas Online API**
- URL : Via partenariat Vestas
- Contact : Service client Vestas pour accès API

---

## ♻️ Biométhane / Méthanisation

### Siemens PLC S7
**Via passerelle IoT**
- Solution : Mettre en place un middleware (Node-RED, etc.)
- API : Custom selon votre installation

### Superviseur WAGO
**REST API**
- URL : `http://[IP_WAGO]/wbm/api/data/[variable]`
- Chemin JSON : `value`
- Auth : Selon configuration

---

## 🔌 Systèmes généralistes

### InfluxDB (base de données temps réel)
**API Query**
```
URL : https://[HOST]:8086/query
Query : SELECT last("power") FROM "measurements"
Chemin : results.0.series.0.values.0.1
Auth : Token
```

### Grafana
**API Datasources**
- URL : `https://[GRAFANA_HOST]/api/ds/query`
- Nécessite configuration spécifique
- Auth : Bearer Token

### ThingSpeak (IoT Platform)
**API Read**
- URL : `https://api.thingspeak.com/channels/[CHANNEL_ID]/feeds/last.json?api_key={READ_KEY}`
- Chemin JSON : `field1`
- Auth : API Key dans URL

### MQTT → REST (via passerelle)
Si vous utilisez MQTT (très courant dans l'IoT) :
1. Mettre en place un broker MQTT
2. Créer une passerelle MQTT→REST (ex: Node-RED)
3. Exposer l'API REST

---

## 🔧 Solutions si vous n'avez pas d'API

### Option 1 : Créer un fichier JSON mis à jour régulièrement
**Setup simple :**
1. Script Python/Bash sur votre serveur qui lit la donnée (depuis votre SCADA, BDD, etc.)
2. Le script écrit dans un fichier `power.json` sur votre serveur web
3. Fichier accessible via : `https://votresite.com/data/power.json`

**Exemple script Python :**
```python
import json
import requests

# Récupérer la valeur depuis votre système
# (exemple fictif)
current_power = get_power_from_scada()

# Écrire dans un fichier JSON
data = {"current_power": current_power}
with open('/var/www/html/power.json', 'w') as f:
    json.dump(data, f)
```

**Cron job (toutes les 5 secondes) :**
```bash
* * * * * /usr/bin/python3 /path/to/script.py
* * * * * sleep 5 && /usr/bin/python3 /path/to/script.py
* * * * * sleep 10 && /usr/bin/python3 /path/to/script.py
...
```

### Option 2 : Utiliser Firebase Realtime Database (gratuit jusqu'à 1GB)
1. Créer un projet Firebase
2. Configurer Realtime Database
3. Script sur votre serveur qui écrit la valeur dans Firebase
4. URL API : `https://[PROJECT].firebaseio.com/current_power.json`

### Option 3 : Google Sheets + API (pour tests rapides)
1. Créer un Google Sheet avec votre valeur
2. Publier en tant que CSV ou JSON
3. URL : `https://docs.google.com/spreadsheets/d/[ID]/gviz/tq?tqx=out:json`
⚠️ Pas recommandé pour production (lent)

---

## 📞 Aide personnalisée

Si votre système n'est pas listé ci-dessus, contactez-nous avec :
1. **Nom de votre système de monitoring / SCADA**
2. **Marque de vos équipements** (onduleurs, éoliennes, etc.)
3. **Captures d'écran** de votre interface de monitoring

Nous vous aiderons à trouver la solution adaptée.

---

## ⚠️ Important - Sécurité

### ✅ Bonnes pratiques :
- Utiliser HTTPS (pas HTTP)
- Ne jamais exposer vos identifiants dans l'URL
- Créer une clé API dédiée (pas votre mot de passe admin)
- Limiter les droits de cette clé à la lecture seule
- Mettre en place un rate limiting (max 100 requêtes/min)

### ❌ À éviter :
- Exposer votre base de données directement
- Utiliser des URLs avec identifiants/mots de passe en clair
- Désactiver complètement l'authentification

---

**Besoin d'une solution sur-mesure ?**

Nous pouvons développer une passerelle API personnalisée pour votre système.
Tarif indicatif : 500-1500€ selon la complexité (développement + hébergement 1 an).

Contactez-nous pour un devis personnalisé.
