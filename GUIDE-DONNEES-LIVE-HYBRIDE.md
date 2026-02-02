# Guide : Système Hybride de Données Temps Réel

## Vue d'ensemble

Le système supporte **automatiquement** deux méthodes de récupération de données en temps réel :

| Méthode | Quand | Comment |
|---------|-------|---------|
| **PUSH** | Le client installe un script Python | Script → Supabase → Vous lisez |
| **PULL** | Le client a déjà une API accessible | Vous → API du client |

Le système **détecte automatiquement** quelle méthode utiliser.

---

## Méthode 1 : PUSH (Script Python chez le client)

### Côté client

1. **Générer la clé API** dans le dashboard admin
2. **Envoyer le kit** au client ([kit-client-push-data/](kit-client-push-data/))
3. Le client configure et lance le script

### Côté vous

Les données arrivent automatiquement dans la table `live_data`.

**Aucune configuration nécessaire** dans le projet.

---

## Méthode 2 : PULL (URL JSON API)

### Côté client

Le client vous donne :
- Une URL accessible (`https://api-client.com/production`)
- Le chemin JSON de la valeur (`current_power`)

### Côté vous

Dans le formulaire du projet, remplissez :
- **URL API JSON** : `https://api-client.com/production`
- **Chemin JSON** : `current_power`

---

## Utilisation dans le code

### Hook React

```jsx
import useHybridLiveData from '@/hooks/useHybridLiveData';

function MonComposant({ projectId }) {
  const { data, loading, error, source } = useHybridLiveData(projectId, 5000);

  // data.value    → La valeur (ex: 42.5)
  // data.unit     → L'unité (ex: "kW")
  // data.timestamp → Date/heure
  // source        → 'push' ou 'pull'
}
```

### Composant prêt à l'emploi

```jsx
import LiveDataDisplay from '@/components/LiveDataDisplay';

<LiveDataDisplay projectId={project.id} />
```

Affiche automatiquement :
- **Icon vert** (Wifi) si données PUSH
- **Icon bleu** (Activity) si données PULL
- La valeur + unité
- L'heure de mise à jour

---

## Logique de sélection

Le système essaie dans cet ordre :

1. **Essaie PUSH** : Y a-t-il des données dans `live_data` ?
2. **Sinon PULL** : Y a-t-il un `live_data_url` configuré ?
3. **Sinon** : Affiche "Aucune donnée disponible"

---

## Exemples d'utilisation

### Cas 1 : Client avec script Python

1. Générer clé API dans admin
2. Envoyer kit au client
3. Le client lance le script
4. ✅ Les données s'affichent automatiquement (PUSH)

### Cas 2 : Client avec API SMA/Fronius/etc.

1. Demander l'URL au client
2. Remplir `live_data_url` dans le projet
3. ✅ Les données s'affichent automatiquement (PULL)

### Cas 3 : Migration PULL → PUSH

Un client avait une API, maintenant il installe le script :

1. Le script commence à envoyer
2. ✅ Le système bascule automatiquement sur PUSH
3. Vous pouvez retirer l'URL (optionnel)

---

## Tester en local

### Simuler PUSH

```sql
-- Insérer une donnée de test
INSERT INTO live_data (project_id, value, unit)
VALUES ('UUID_DU_PROJET', 42.5, 'kW');
```

### Simuler PULL

Utiliser une API de test :
```
URL : https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson
Chemin : features.0.properties.mag
```

---

## Tables utilisées

| Table | Rôle |
|-------|------|
| `api_keys` | Clés API pour l'approche PUSH |
| `live_data` | Stockage des données PUSH reçues |
| `live_data_latest` | Vue optimisée (dernière valeur par projet) |
| `projects.live_data_url` | URL pour l'approche PULL |
| `projects.live_data_path` | Chemin JSON pour l'approche PULL |

---

## Avantages du système hybride

✅ **Flexibilité** : S'adapte à tous les clients
✅ **Automatique** : Pas besoin de choisir manuellement
✅ **Migration facile** : Peut basculer d'une approche à l'autre
✅ **Robustesse** : Fallback si une source est indisponible

