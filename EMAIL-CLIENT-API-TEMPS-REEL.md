# Email à envoyer au client - Intégration données temps réel

---

**Objet :** Affichage en temps réel de vos données sur la carte interactive - Spécifications techniques

---

Bonjour [Nom du client],

Nous avons développé une nouvelle fonctionnalité qui permet d'afficher **les données en temps réel** de vos installations directement sur la carte interactive.

Concrètement, vos visiteurs pourront voir la **puissance actuelle** de votre centrale solaire/éolienne/biométhane mise à jour automatiquement toutes les 5 secondes, sans recharger la page.

## 📊 Ce que nous avons mis en place

### Sur votre carte interactive :
- ✅ Affichage d'une **icône animée** (⚡) indiquant les données en direct
- ✅ **Rafraîchissement automatique** toutes les 5 secondes
- ✅ Gestion des erreurs (si votre serveur ne répond pas, on affiche "Erreur de connexion")
- ✅ Compatible avec votre page embed (celle que vous pouvez intégrer sur votre site)

### Exemple visuel :
```
┌─────────────────────────────────┐
│ 🌞 Centrale Solaire XYZ        │
│                                 │
│ ⚡ Temps réel (icône qui pulse) │
│    42.5 MW                      │
│    ↑ Cette valeur se met à jour│
│      toutes les 5 secondes      │
└─────────────────────────────────┘
```

---

## 🔧 Ce dont nous avons besoin de votre côté

Pour que cette fonctionnalité fonctionne, **vous devez mettre à disposition une API JSON** qui retourne la valeur actuelle de puissance de votre installation.

### Option 1 : Vous avez déjà un système de monitoring
Si vous utilisez déjà un logiciel de supervision (SCADA, plateforme de monitoring), il y a de fortes chances qu'il propose une **API REST** pour récupérer les données.

👉 **Demandez à votre prestataire technique :**
- L'URL de l'API qui retourne la puissance actuelle
- Le format de la réponse JSON
- Si une authentification est nécessaire (clé API, token, etc.)

### Option 2 : Vous n'avez pas encore d'API
Pas de problème ! Nous pouvons vous aider à mettre en place une solution simple :
- Créer un petit serveur qui récupère les données de votre système et les expose en JSON
- Utiliser un service tiers (ex: ThingSpeak, Firebase) pour héberger vos données
- Vous conseiller sur la meilleure solution selon votre infrastructure

---

## 📋 Spécifications techniques de l'API

Voici ce que votre API doit retourner :

### 1. Format de réponse attendu

**Format simple (recommandé) :**
```json
{
  "current_power": 42.5
}
```

**Format avec métadonnées (optionnel) :**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "power": {
      "value": 42.5,
      "unit": "MW"
    }
  }
}
```

### 2. Méthode HTTP
- **Méthode** : `GET` (lecture seule)
- **Protocole** : HTTPS (obligatoire pour la sécurité)

### 3. URL d'exemple
```
https://api.votreentreprise.com/centrale-solaire/puissance-actuelle
```

Ou avec un identifiant de projet :
```
https://monitoring.votreentreprise.fr/projects/abc123/current-power
```

### 4. Headers HTTP requis
Votre serveur doit autoriser les requêtes depuis notre domaine (CORS) :

```
Access-Control-Allow-Origin: https://quelia.fr
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

💡 **Si vous ne savez pas comment configurer CORS**, nous pouvons vous guider.

### 5. Fréquence d'appels
Notre système interrogera votre API **toutes les 5 secondes** lorsqu'un visiteur consulte votre POI sur la carte.

⚠️ **Important** : Votre serveur doit être capable de gérer environ **10 requêtes par minute** (quand plusieurs visiteurs consultent la carte simultanément).

### 6. Temps de réponse
Votre API devrait répondre en **moins de 3 secondes** (idéalement < 1 seconde).

---

## 🔐 Authentification (si nécessaire)

Si votre API nécessite une authentification :

### Option 1 : API Key dans l'URL (simple)
```
https://api.votreentreprise.com/power?apikey=VOTRE_CLE_SECRETE
```

### Option 2 : API Key dans les headers HTTP (recommandé)
```
Authorization: Bearer VOTRE_TOKEN
```
Ou
```
X-API-Key: VOTRE_CLE_SECRETE
```

👉 Nous pourrons stocker cette clé de manière sécurisée dans notre base de données.

---

## 📝 Informations à nous fournir

Pour configurer l'affichage en temps réel, merci de nous communiquer :

### ✅ Informations obligatoires :
1. **URL complète de l'API**
   - Exemple : `https://monitoring.votresite.com/api/v1/centrale-123/power`

2. **Chemin vers la valeur dans le JSON**
   - Si format simple → `current_power`
   - Si format complexe → `data.power.value`

3. **Unité de la valeur**
   - kW (kilowatt)
   - MW (mégawatt)
   - Nm3/h (pour biométhane)

### 🔒 Informations optionnelles :
4. **Clé d'authentification** (si nécessaire)
   - Type : API Key, Bearer Token, Basic Auth ?
   - Valeur de la clé

5. **Exemple de réponse JSON**
   - Copiez-collez un exemple réel de ce que retourne votre API

---

## 🧪 Comment tester votre API

Avant de nous envoyer l'URL, vous pouvez la tester vous-même :

### Méthode 1 : Dans votre navigateur
Ouvrez simplement l'URL dans Chrome/Firefox :
```
https://api.votreentreprise.com/power
```

Vous devriez voir du JSON s'afficher. Si vous voyez un message d'erreur ou une page HTML → ❌ L'API n'est pas correctement configurée.

### Méthode 2 : Avec curl (ligne de commande)
```bash
curl "https://api.votreentreprise.com/power"
```

Réponse attendue :
```json
{"current_power": 42.5}
```

---

## 🚀 Mise en production

### Étapes :
1. Vous nous fournissez les informations ci-dessus
2. Nous configurons l'affichage dans votre espace admin
3. Nous testons ensemble sur la carte de prévisualisation
4. Une fois validé, nous activons sur la carte publique

**Délai estimé** : 1 jour ouvré après réception de vos informations

---

## ❓ Questions fréquentes

### Q : Que se passe-t-il si notre serveur est temporairement indisponible ?
**R :** La carte affichera "Erreur de connexion" à la place de la valeur. Dès que votre serveur sera de nouveau accessible, l'affichage reprendra automatiquement.

### Q : Peut-on afficher plusieurs valeurs (puissance + température + etc.) ?
**R :** Oui, c'est possible ! Pour l'instant nous affichons uniquement la puissance, mais nous pouvons étendre la fonctionnalité. Contactez-nous si vous avez besoin d'afficher d'autres données.

### Q : L'API doit-elle être publique ou peut-elle être protégée ?
**R :** Elle peut être protégée par une clé d'authentification. Nous stockons cette clé de manière sécurisée.

### Q : Nos données sont sensibles, est-ce sécurisé ?
**R :** Oui. Les appels sont faits en HTTPS (cryptés), et seule la valeur de puissance est affichée publiquement. Si vous ne souhaitez pas exposer ces données, vous pouvez choisir de ne pas activer cette fonctionnalité.

### Q : Peut-on changer la fréquence de rafraîchissement ?
**R :** Oui, nous pouvons ajuster entre 1 seconde et 1 minute selon vos besoins. Par défaut : 5 secondes.

---

## 📞 Besoin d'aide ?

Si vous avez des questions techniques ou si vous souhaitez que nous vous aidions à mettre en place l'API, n'hésitez pas à nous contacter :

📧 **Email** : [votre.email@quelia.fr]
📱 **Téléphone** : [votre numéro]
💬 **Visio** : Nous pouvons organiser un point technique de 30 minutes

---

Nous restons à votre disposition pour toute question.

Bien cordialement,

[Votre nom]
Quelia

---

## 📎 Annexes

### Exemple de configuration complète

**Client** : Centrale Solaire du Sud
**URL API** : `https://scada.solaire-sud.fr/api/projects/centrale-marseille/realtime`
**Chemin JSON** : `data.production.currentPower`
**Unité** : MW
**Authentification** : Header `X-API-Key: abc123def456`

**Exemple de réponse de leur API :**
```json
{
  "status": "online",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "production": {
      "currentPower": 15.8,
      "peakPower": 18.2,
      "dailyProduction": 142.5
    }
  }
}
```

**Configuration dans notre admin :**
- URL : `https://scada.solaire-sud.fr/api/projects/centrale-marseille/realtime`
- Chemin : `data.production.currentPower`
- Auth Header : `X-API-Key`
- Auth Value : `abc123def456`

---

### Template de réponse client

Pour nous faciliter la tâche, vous pouvez nous renvoyer ce template rempli :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONFIGURATION API TEMPS RÉEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom du projet : _______________________

URL de l'API : _______________________

Chemin JSON : _______________________

Unité : ☐ kW  ☐ MW  ☐ Nm3/h  ☐ Autre : ___

Authentification requise : ☐ Oui  ☐ Non

Si oui, type : ☐ API Key dans URL
               ☐ Header Authorization
               ☐ Header X-API-Key
               ☐ Autre : _______________

Valeur de la clé : _______________________

Exemple de réponse JSON :
{

}

Contact technique (si besoin d'aide) :
Nom : _______________________
Email : _______________________
Tél : _______________________
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
