# Guide : Données en temps réel pour les POI

## 📋 Ce qui a été implémenté

### Fonctionnalités ajoutées :
1. **Hook React `useLiveData`** : Fetch automatique des données depuis une API JSON
2. **Rafraîchissement automatique** : Toutes les 5 secondes
3. **Affichage dans les popups** : Icône animée + valeur en temps réel
4. **Affichage dans la page embed** : Carte mise en avant avec animation
5. **Champs dans le formulaire** : URL API + Chemin JSON

---

## 🔧 Installation

### 1. Exécuter la migration SQL

Dans Supabase → SQL Editor, exécutez :

```sql
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS live_data_url TEXT,
ADD COLUMN IF NOT EXISTS live_data_path TEXT DEFAULT 'current_power';
```

### 2. Fichiers créés/modifiés

- ✅ `src/hooks/useLiveData.js` (nouveau)
- ✅ `src/components/ProjectForm.jsx` (modifié)
- ✅ `src/components/ProjectPopup.jsx` (modifié)
- ✅ `src/pages/PoiEmbedPage.jsx` (modifié)

---

## 📧 Ce que vous devez demander au client

### Email type à envoyer :

> **Objet : Configuration des données en temps réel pour votre projet**
>
> Bonjour,
>
> Pour afficher la puissance en temps réel de votre installation sur notre carte interactive, j'ai besoin des informations suivantes :
>
> ### 1. URL de l'API
> Quelle est l'adresse complète qui retourne les données actuelles ?
> - Exemple : `https://api.votreentreprise.com/centrale-12345/power`
>
> ### 2. Format de la réponse JSON
> Merci de me fournir un exemple de réponse de votre API.
>
> **Exemple simple :**
> ```json
> {
>   "current_power": 42.5
> }
> ```
>
> **Exemple complexe :**
> ```json
> {
>   "data": {
>     "measurements": {
>       "power": 42.5,
>       "unit": "MW",
>       "timestamp": "2024-01-15T10:30:00Z"
>     }
>   }
> }
> ```
>
> ### 3. Chemin vers la valeur
> Dans quel champ se trouve la valeur de puissance ?
> - Si format simple : `current_power`
> - Si format complexe : `data.measurements.power`
>
> ### 4. Unité
> Quelle unité utilisez-vous ?
> - kW (kilowatt)
> - MW (mégawatt)
> - Nm3/h (pour biométhane)
>
> ### 5. Accès CORS (important technique)
> Votre API doit autoriser les requêtes depuis notre domaine `quelia.fr`.
> Si vous ne savez pas comment faire, je peux vous guider.
>
> ### 6. Authentification (optionnel)
> L'API nécessite-t-elle une clé d'authentification ?
> - Si oui : Quelle méthode ? (API Key dans header, Bearer token, etc.)
>
> ---
>
> **Fréquence de rafraîchissement :**
> Les données seront automatiquement mises à jour toutes les 5 secondes sur la carte.
>
> Merci !

---

## 🎯 Exemples de configuration

### Exemple 1 : API simple

**URL :** `https://api-client.com/project/abc123/current-power`

**Réponse JSON :**
```json
{
  "current_power": 42.5
}
```

**Configuration dans l'admin :**
- URL API JSON : `https://api-client.com/project/abc123/current-power`
- Chemin JSON : `current_power`

---

### Exemple 2 : API imbriquée

**URL :** `https://monitoring.client.fr/api/v2/installations/solar-park-1/data`

**Réponse JSON :**
```json
{
  "status": "ok",
  "data": {
    "realtime": {
      "production": {
        "value": 15.8,
        "unit": "MW"
      }
    }
  }
}
```

**Configuration dans l'admin :**
- URL API JSON : `https://monitoring.client.fr/api/v2/installations/solar-park-1/data`
- Chemin JSON : `data.realtime.production.value`

---

### Exemple 3 : API avec array

**URL :** `https://scada.client.com/get-measurements?site=wind-farm-42`

**Réponse JSON :**
```json
{
  "measurements": [
    {
      "type": "power",
      "value": 28.3,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Configuration dans l'admin :**
- URL API JSON : `https://scada.client.com/get-measurements?site=wind-farm-42`
- Chemin JSON : `measurements.0.value`
  *(Le `.0` signifie "premier élément du tableau")*

---

## ⚠️ Problèmes CORS possibles

Si l'affichage ne fonctionne pas, c'est souvent à cause de CORS.

### Symptômes :
- Console du navigateur affiche : `Access to fetch at ... has been blocked by CORS policy`

### Solution :
Le client doit ajouter ces headers HTTP dans sa réponse API :

```
Access-Control-Allow-Origin: https://quelia.fr
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Ou autoriser tous les domaines (moins sécurisé) :
```
Access-Control-Allow-Origin: *
```

---

## 🧪 Tester la configuration

### 1. Dans l'admin
1. Modifier un POI existant
2. Remplir "URL API JSON" et "Chemin JSON"
3. Enregistrer
4. Ouvrir le POI sur la carte
5. Vérifier que la valeur "Temps réel" apparaît avec l'icône qui pulse

### 2. Tester avec curl (terminal)
```bash
curl "https://api-client.com/project/123/power"
```

Si ça retourne du JSON valide → ✅ L'API fonctionne

### 3. Vérifier dans la console du navigateur
Ouvrir DevTools (F12) → Console
Si vous voyez des erreurs rouges → ❌ Problème CORS ou URL incorrecte

---

## 🔄 Comment ça marche techniquement

```
┌─────────────────┐
│   API Externe   │ ← Le client héberge ça
│  (JSON REST)    │
└────────┬────────┘
         │ Toutes les 5 secondes
         ▼
┌─────────────────┐
│  useLiveData    │ ← Hook React qui fetch
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ProjectPopup   │ ← Affichage sur la carte
│  PoiEmbedPage   │
└─────────────────┘
```

### Logique :
1. L'admin configure l'URL + le chemin JSON
2. Quand on ouvre un POI, le hook `useLiveData` se déclenche
3. Il fait un `fetch()` vers l'URL toutes les 5 secondes
4. Il extrait la valeur selon le chemin (ex: `data.power`)
5. Il affiche la valeur avec une icône animée

---

## 📝 Notes importantes

- ✅ Le rafraîchissement s'arrête quand on ferme le popup (économise les appels API)
- ✅ Si l'API ne répond pas, on affiche "Erreur de connexion"
- ✅ Pendant le chargement, on affiche "Chargement..."
- ✅ Si pas d'URL configurée, rien ne s'affiche (pas de bug)
- ⚠️ L'API doit être en HTTPS (pas HTTP)
- ⚠️ L'API doit répondre en moins de 30 secondes (sinon timeout)

---

## 🚀 Prochaines évolutions possibles

Si un client a besoin :
1. **Authentification API** : Ajouter un champ pour la clé API
2. **Plusieurs valeurs** : Afficher température + puissance + etc.
3. **Historique** : Graphique des 24 dernières heures
4. **Alarmes** : Alert si la valeur dépasse un seuil
5. **Intervalle personnalisé** : Permettre au client de choisir 1s, 10s, 1min...

---

Besoin d'aide ? Contactez-moi !
