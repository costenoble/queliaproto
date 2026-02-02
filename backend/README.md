# Quelia Backend API

API REST pour l'application Quelia - Migration VPS OVH

## 🚀 Installation locale

### 1. Installer les dépendances

```bash
cd backend
npm install
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
```

Éditez `.env` et renseignez vos informations :
```env
DATABASE_URL=postgresql://quelia_user:votre_password@localhost:5432/quelia
JWT_SECRET=une_chaine_tres_longue_et_aleatoire
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:4000
```

### 3. Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer l'utilisateur et la base
CREATE USER quelia_user WITH PASSWORD 'votre_password';
CREATE DATABASE quelia OWNER quelia_user;
GRANT ALL PRIVILEGES ON DATABASE quelia TO quelia_user;
\q
```

### 4. Importer le schéma de base de données

Si vous migrez depuis Supabase, importez votre dump :
```bash
psql -U quelia_user -d quelia -f supabase_export.sql
```

### 5. Démarrer le serveur

**Mode développement (avec nodemon) :**
```bash
npm run dev
```

**Mode production :**
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

---

## 📋 Endpoints disponibles

### Authentification (`/api/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/login` | Connexion | Non |
| POST | `/api/auth/register` | Inscription | Non |
| GET | `/api/auth/me` | Info utilisateur | Oui |
| POST | `/api/auth/logout` | Déconnexion | Non |

### Projets (`/api/projects`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/projects` | Liste des projets | Non |
| GET | `/api/projects/:id` | Un projet | Non |
| POST | `/api/projects` | Créer un projet | Oui |
| PUT | `/api/projects/:id` | Modifier un projet | Oui |
| DELETE | `/api/projects/:id` | Supprimer un projet | Oui |

**Query params disponibles pour GET /api/projects :**
- `client_id` : Filtrer par client
- `slug` : Filtrer par slug client

### Clients (`/api/clients`)

| Méthode | Endpoint | Description | Auth | Rôle |
|---------|----------|-------------|------|------|
| GET | `/api/clients` | Liste des clients | Oui | - |
| GET | `/api/clients/:id` | Un client | Oui | - |
| GET | `/api/clients/by-slug/:slug` | Client par slug | Non | - |
| POST | `/api/clients` | Créer un client | Oui | super_admin |
| PUT | `/api/clients/:id` | Modifier un client | Oui | super_admin |
| DELETE | `/api/clients/:id` | Supprimer un client | Oui | super_admin |

---

## 🔐 Authentification

L'API utilise des **tokens JWT** pour l'authentification.

### 1. Se connecter

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "user",
    "client_id": "uuid"
  }
}
```

### 2. Utiliser le token

Pour les endpoints protégés, ajoutez le header :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemple avec curl :**
```bash
curl -H "Authorization: Bearer VOTRE_TOKEN" \
     http://localhost:3000/api/projects
```

**Exemple avec fetch :**
```javascript
fetch('http://localhost:3000/api/projects', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 🧪 Tester l'API

### Health check

```bash
curl http://localhost:3000/health
```

Réponse :
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

### Récupérer tous les projets

```bash
curl http://localhost:3000/api/projects
```

### Créer un projet (authentifié)

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "name": "Centrale Solaire Test",
    "latitude": 48.8566,
    "longitude": 2.3522,
    "city": "Paris",
    "energy_category": "solaire",
    "status": "en exploitation"
  }'
```

---

## 📁 Structure du code

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Configuration PostgreSQL
│   ├── middleware/
│   │   └── auth.js              # Middleware JWT
│   ├── routes/
│   │   ├── auth.js              # Routes authentification
│   │   ├── projects.js          # Routes projets
│   │   └── clients.js           # Routes clients
│   └── server.js                # Point d'entrée
├── .env                         # Variables d'environnement
├── .env.example                 # Template des variables
├── package.json
└── README.md
```

---

## 🔧 Déploiement en production

### Avec PM2 (recommandé)

```bash
# Installer PM2
npm install -g pm2

# Démarrer l'API
pm2 start src/server.js --name quelia-api

# Configurer PM2 pour démarrer au boot
pm2 startup
pm2 save
```

### Logs

```bash
# Voir les logs
pm2 logs quelia-api

# Monitoring en temps réel
pm2 monit
```

---

## 🛡️ Sécurité

- ✅ Helmet pour les headers HTTP sécurisés
- ✅ CORS configuré
- ✅ Rate limiting (100 req/15min par IP)
- ✅ Mots de passe hashés avec bcrypt
- ✅ Tokens JWT avec expiration (7 jours)
- ✅ Validation des entrées
- ✅ Requêtes préparées (protection SQL injection)

---

## 📊 Base de données

### Schéma principal

**Table `users`**
- id (UUID, PK)
- email (VARCHAR)
- password_hash (VARCHAR)
- role (VARCHAR) : 'user', 'admin', 'super_admin'
- client_id (UUID, FK → clients)
- created_at (TIMESTAMP)

**Table `clients`**
- id (UUID, PK)
- name (VARCHAR)
- slug (VARCHAR, UNIQUE)
- logo_url (TEXT)
- created_at (TIMESTAMP)

**Table `projects`**
- id (UUID, PK)
- name (VARCHAR)
- display_name (VARCHAR)
- operator (VARCHAR)
- poi_logo_url (TEXT)
- energy_category (VARCHAR)
- energy_subtype (VARCHAR)
- status (VARCHAR)
- commissioning_year (INTEGER)
- city (VARCHAR)
- address (TEXT)
- latitude (FLOAT)
- longitude (FLOAT)
- communes (TEXT[])
- intercommunalites (TEXT[])
- region (VARCHAR)
- nominal_power (FLOAT)
- nominal_power_unit (VARCHAR)
- actual_power (FLOAT)
- actual_power_unit (VARCHAR)
- equivalent_display (VARCHAR)
- live_data_url (TEXT)
- live_data_path (TEXT)
- description (TEXT)
- url_type (VARCHAR)
- project_url (TEXT)
- client_id (UUID, FK → clients)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

---

## 🐛 Troubleshooting

### Erreur de connexion PostgreSQL

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions :**
1. Vérifier que PostgreSQL est actif : `sudo systemctl status postgresql`
2. Vérifier la chaîne de connexion dans `.env`
3. Vérifier les credentials : `psql -U quelia_user -d quelia`

### JWT Secret non défini

```
Error: JWT_SECRET is not defined
```

**Solution :** Créer le fichier `.env` et définir `JWT_SECRET`

### Port déjà utilisé

```
Error: listen EADDRINUSE :::3000
```

**Solution :** Changer le port dans `.env` ou tuer le processus :
```bash
lsof -ti :3000 | xargs kill -9
```

---

## 📞 Support

Pour toute question, consultez le guide complet de migration : `MIGRATION-VPS-GUIDE.md`
