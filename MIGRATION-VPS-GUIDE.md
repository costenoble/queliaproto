# Guide complet de migration Supabase → VPS OVH

## 🎯 Vue d'ensemble

**Ce guide vous accompagne pour migrer votre application Quelia de Supabase vers un VPS OVH.**

**Durée estimée** : 20-30 heures de développement
**Difficulté** : ⭐⭐⭐ Avancée

---

## Phase 1 : Préparation du VPS OVH (2-3h)

### 1.1 Louer le VPS

1. Allez sur https://www.ovhcloud.com/fr/vps/
2. Choisissez **VPS Value** (minimum) :
   - 4 GB RAM
   - 2 vCPU
   - 80 GB SSD
   - ~12€/mois
3. OS : **Ubuntu 22.04 LTS**
4. Validez la commande

### 1.2 Première connexion SSH

OVH vous envoie un email avec :
- IP du serveur : `123.45.67.89`
- Login : `ubuntu` ou `root`
- Mot de passe temporaire

**Connexion :**
```bash
ssh root@123.45.67.89
# Entrez le mot de passe
```

### 1.3 Sécurisation initiale

```bash
# Mettre à jour le système
apt update && apt upgrade -y

# Créer un utilisateur non-root
adduser quelia
usermod -aG sudo quelia

# Configurer un pare-feu
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# Installer les outils de base
apt install -y curl wget git vim
```

### 1.4 Configurer les clés SSH (recommandé)

**Sur votre machine locale :**
```bash
# Générer une clé SSH si vous n'en avez pas
ssh-keygen -t ed25519 -C "votre@email.com"

# Copier la clé sur le serveur
ssh-copy-id quelia@123.45.67.89
```

**Désactiver l'authentification par mot de passe :**
```bash
# Sur le serveur
sudo vim /etc/ssh/sshd_config

# Modifier ces lignes :
PasswordAuthentication no
PermitRootLogin no

# Redémarrer SSH
sudo systemctl restart sshd
```

---

## Phase 2 : Installation de PostgreSQL (1h)

### 2.1 Installer PostgreSQL 15

```bash
# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Vérifier que PostgreSQL est actif
sudo systemctl status postgresql

# Se connecter à PostgreSQL
sudo -u postgres psql
```

### 2.2 Créer la base de données

```sql
-- Dans le shell PostgreSQL (psql)

-- Créer un utilisateur
CREATE USER quelia_user WITH PASSWORD 'VOTRE_MOT_DE_PASSE_FORT';

-- Créer la base de données
CREATE DATABASE quelia OWNER quelia_user;

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE quelia TO quelia_user;

-- Quitter
\q
```

### 2.3 Configurer l'accès distant (si nécessaire)

```bash
# Éditer pg_hba.conf
sudo vim /etc/postgresql/15/main/pg_hba.conf

# Ajouter cette ligne (ATTENTION : sécurisez avec votre IP)
host    quelia    quelia_user    0.0.0.0/0    scram-sha-256

# Éditer postgresql.conf
sudo vim /etc/postgresql/15/main/postgresql.conf

# Modifier cette ligne :
listen_addresses = '*'

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

---

## Phase 3 : Exporter les données de Supabase (1-2h)

### 3.1 Exporter via l'interface Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Database** → **Backups** → **Download backup**

OU

### 3.2 Exporter via pg_dump (recommandé)

```bash
# Sur votre machine locale
# Récupérez vos credentials Supabase :
# Project Settings → Database → Connection string

pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
  --schema=public \
  --no-owner \
  --no-acl \
  > supabase_export.sql
```

### 3.3 Nettoyer le dump (important!)

Le dump Supabase contient des extensions qu'il faut retirer :

```bash
# Retirer les lignes problématiques
sed -i '/CREATE EXTENSION/d' supabase_export.sql
sed -i '/supabase_/d' supabase_export.sql
sed -i '/auth\./d' supabase_export.sql
sed -i '/storage\./d' supabase_export.sql
```

### 3.4 Importer dans PostgreSQL sur VPS

```bash
# Copier le fichier sur le serveur
scp supabase_export.sql quelia@123.45.67.89:~/

# Sur le serveur VPS
psql -U quelia_user -d quelia -f ~/supabase_export.sql
```

---

## Phase 4 : Créer le backend API (10-15h)

### 4.1 Installer Node.js

```bash
# Installer NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc

# Installer Node.js LTS
nvm install --lts
node --version  # v20.x.x
```

### 4.2 Structure du projet backend

```bash
# Créer le dossier
mkdir -p /var/www/quelia-api
cd /var/www/quelia-api

# Initialiser le projet
npm init -y

# Installer les dépendances
npm install express pg cors dotenv bcrypt jsonwebtoken helmet express-rate-limit
npm install --save-dev nodemon
```

### 4.3 Créer le fichier .env

```bash
# /var/www/quelia-api/.env
DATABASE_URL=postgresql://quelia_user:VOTRE_PASSWORD@localhost:5432/quelia
JWT_SECRET=VOTRE_SECRET_ULTRA_LONG_ET_ALEATOIRE
PORT=3000
NODE_ENV=production
```

### 4.4 Structure des dossiers

```
quelia-api/
├── src/
│   ├── config/
│   │   └── database.js       # Configuration PostgreSQL
│   ├── middleware/
│   │   ├── auth.js           # Middleware d'authentification
│   │   └── errorHandler.js   # Gestion des erreurs
│   ├── routes/
│   │   ├── auth.js           # Routes d'authentification
│   │   ├── projects.js       # Routes POI/projets
│   │   ├── clients.js        # Routes clients
│   │   └── users.js          # Routes utilisateurs
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectsController.js
│   │   └── clientsController.js
│   └── server.js             # Point d'entrée
├── .env
├── package.json
└── ecosystem.config.js       # Config PM2
```

### 4.5 Fichier principal server.js

```javascript
// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectsRoutes = require('./routes/projects');
const clientsRoutes = require('./routes/clients');

const app = express();

// Sécurité
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://quelia.fr',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // max 100 requêtes par IP
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/clients', clientsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
```

### 4.6 Configuration base de données

```javascript
// src/config/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

### 4.7 Middleware d'authentification

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
```

### 4.8 Routes d'authentification

```javascript
// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register (optionnel)
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur
    const result = await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, passwordHash, role || 'user']
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### 4.9 Routes des projets/POI

```javascript
// src/routes/projects.js
const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET tous les projets (public)
router.get('/', async (req, res) => {
  try {
    const { client_id } = req.query;

    let query = 'SELECT p.*, c.name as client_name, c.logo_url as client_logo FROM projects p LEFT JOIN clients c ON p.client_id = c.id';
    let params = [];

    if (client_id) {
      query += ' WHERE p.client_id = $1';
      params.push(client_id);
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET un projet par ID (public)
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT p.*, c.name as client_name, c.logo_url as client_logo FROM projects p LEFT JOIN clients c ON p.client_id = c.id WHERE p.id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST créer un projet (protégé)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name, display_name, operator, poi_logo_url,
      energy_category, energy_subtype, status, commissioning_year,
      city, address, latitude, longitude,
      communes, intercommunalites, region,
      nominal_power, nominal_power_unit,
      actual_power, actual_power_unit,
      equivalent_display,
      live_data_url, live_data_path,
      description, url_type, project_url,
      client_id
    } = req.body;

    const result = await db.query(
      `INSERT INTO projects (
        name, display_name, operator, poi_logo_url,
        energy_category, energy_subtype, status, commissioning_year,
        city, address, latitude, longitude,
        communes, intercommunalites, region,
        nominal_power, nominal_power_unit,
        actual_power, actual_power_unit,
        equivalent_display,
        live_data_url, live_data_path,
        description, url_type, project_url,
        client_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26,
        NOW(), NOW()
      ) RETURNING *`,
      [
        name, display_name, operator, poi_logo_url,
        energy_category, energy_subtype, status, commissioning_year,
        city, address, latitude, longitude,
        communes, intercommunalites, region,
        nominal_power, nominal_power_unit,
        actual_power, actual_power_unit,
        equivalent_display,
        live_data_url, live_data_path,
        description, url_type, project_url,
        client_id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT modifier un projet (protégé)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name, display_name, operator, poi_logo_url,
      energy_category, energy_subtype, status, commissioning_year,
      city, address, latitude, longitude,
      communes, intercommunalites, region,
      nominal_power, nominal_power_unit,
      actual_power, actual_power_unit,
      equivalent_display,
      live_data_url, live_data_path,
      description, url_type, project_url,
      client_id
    } = req.body;

    const result = await db.query(
      `UPDATE projects SET
        name = $1, display_name = $2, operator = $3, poi_logo_url = $4,
        energy_category = $5, energy_subtype = $6, status = $7, commissioning_year = $8,
        city = $9, address = $10, latitude = $11, longitude = $12,
        communes = $13, intercommunalites = $14, region = $15,
        nominal_power = $16, nominal_power_unit = $17,
        actual_power = $18, actual_power_unit = $19,
        equivalent_display = $20,
        live_data_url = $21, live_data_path = $22,
        description = $23, url_type = $24, project_url = $25,
        client_id = $26, updated_at = NOW()
      WHERE id = $27 RETURNING *`,
      [
        name, display_name, operator, poi_logo_url,
        energy_category, energy_subtype, status, commissioning_year,
        city, address, latitude, longitude,
        communes, intercommunalites, region,
        nominal_power, nominal_power_unit,
        actual_power, actual_power_unit,
        equivalent_display,
        live_data_url, live_data_path,
        description, url_type, project_url,
        client_id,
        req.params.id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE supprimer un projet (protégé)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

### 4.10 Configuration PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'quelia-api',
    script: 'src/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/quelia-api/error.log',
    out_file: '/var/log/quelia-api/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

---

## Phase 5 : Modifier le Frontend (8-12h)

### 5.1 Créer un client API

```javascript
// src/lib/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.quelia.fr/api';

// Stocker le token
let authToken = localStorage.getItem('auth_token');

export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

// Fonction générique pour les requêtes
const apiRequest = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

// Auth
export const auth = {
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthToken(data.token);
    return data;
  },

  logout: () => {
    setAuthToken(null);
  }
};

// Projects
export const projects = {
  getAll: (clientId) => {
    const params = clientId ? `?client_id=${clientId}` : '';
    return apiRequest(`/projects${params}`);
  },

  getById: (id) => {
    return apiRequest(`/projects/${id}`);
  },

  create: (projectData) => {
    return apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  },

  update: (id, projectData) => {
    return apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  },

  delete: (id) => {
    return apiRequest(`/projects/${id}`, {
      method: 'DELETE'
    });
  }
};

// Clients
export const clients = {
  getAll: () => apiRequest('/clients'),
  getById: (id) => apiRequest(`/clients/${id}`),
  create: (clientData) => apiRequest('/clients', {
    method: 'POST',
    body: JSON.stringify(clientData)
  }),
  update: (id, clientData) => apiRequest(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clientData)
  }),
  delete: (id) => apiRequest(`/clients/${id}`, {
    method: 'DELETE'
  })
};
```

### 5.2 Remplacer les appels Supabase

**Avant (Supabase) :**
```javascript
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('client_id', clientId);
```

**Après (API custom) :**
```javascript
import { projects } from '@/lib/apiClient';

const data = await projects.getAll(clientId);
```

### 5.3 Mettre à jour AuthContext

```javascript
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { auth, setAuthToken } from '@/lib/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un token existe au chargement
    const token = localStorage.getItem('auth_token');
    if (token) {
      // TODO: Ajouter une route /auth/me pour récupérer l'utilisateur depuis le token
      setAuthToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await auth.login(email, password);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 5.4 Variables d'environnement

```bash
# .env
VITE_API_URL=https://api.quelia.fr/api
```

---

## Phase 6 : Déploiement (3-4h)

### 6.1 Déployer le backend

```bash
# Sur le serveur VPS
cd /var/www/quelia-api

# Installer PM2 globalement
npm install -g pm2

# Créer le dossier de logs
sudo mkdir -p /var/log/quelia-api
sudo chown quelia:quelia /var/log/quelia-api

# Démarrer l'API avec PM2
pm2 start ecosystem.config.js

# Configurer PM2 pour démarrer au boot
pm2 startup
pm2 save
```

### 6.2 Configurer Nginx pour l'API

```nginx
# /etc/nginx/sites-available/quelia-api
server {
    listen 80;
    server_name api.quelia.fr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/quelia-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Installer le certificat SSL
sudo certbot --nginx -d api.quelia.fr
```

### 6.3 Builder le frontend

```bash
# Sur votre machine locale
cd /Users/costenobleryan/Desktop/quelia

# Builder pour production
npm run build
# → Génère le dossier dist/
```

### 6.4 Déployer le frontend

```bash
# Copier sur le serveur
scp -r dist/ quelia@123.45.67.89:/var/www/quelia-frontend/

# Sur le serveur
sudo chown -R www-data:www-data /var/www/quelia-frontend
```

### 6.5 Configurer Nginx pour le frontend

```nginx
# /etc/nginx/sites-available/quelia-frontend
server {
    listen 80;
    server_name quelia.fr www.quelia.fr;

    root /var/www/quelia-frontend;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    # Cache des assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/quelia-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d quelia.fr -d www.quelia.fr
```

---

## Phase 7 : Configuration DNS (1h)

### 7.1 Pointer les domaines vers le VPS

Chez votre registrar (OVH, Gandi, etc.) :

```
Type    Nom         Valeur              TTL
A       @           123.45.67.89        3600
A       www         123.45.67.89        3600
A       api         123.45.67.89        3600
```

---

## Phase 8 : Monitoring & Backups (2h)

### 8.1 Backups automatiques PostgreSQL

```bash
# Créer le script de backup
sudo vim /usr/local/bin/backup-quelia-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/quelia"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/quelia_$DATE.sql.gz"

# Créer le dossier si nécessaire
mkdir -p $BACKUP_DIR

# Faire le backup
pg_dump -U quelia_user quelia | gzip > $BACKUP_FILE

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "quelia_*.sql.gz" -mtime +30 -delete

echo "Backup créé : $BACKUP_FILE"
```

```bash
# Rendre le script exécutable
sudo chmod +x /usr/local/bin/backup-quelia-db.sh

# Ajouter au cron (tous les jours à 2h du matin)
sudo crontab -e
# Ajouter cette ligne :
0 2 * * * /usr/local/bin/backup-quelia-db.sh
```

### 8.2 Monitoring avec PM2

```bash
# Voir les logs
pm2 logs quelia-api

# Monitoring en temps réel
pm2 monit

# Statistiques
pm2 status
```

---

## Checklist finale ✅

Avant de basculer en production :

- [ ] Base de données migrée et testée
- [ ] API backend fonctionnelle (tous les endpoints testés)
- [ ] Frontend buildé et déployé
- [ ] SSL configuré (HTTPS)
- [ ] DNS pointant vers le VPS
- [ ] Backups automatiques configurés
- [ ] PM2 configuré pour redémarrer au boot
- [ ] Pare-feu (UFW) configuré
- [ ] Authentification testée
- [ ] Toutes les fonctionnalités testées
- [ ] Performance testée (temps de réponse < 500ms)

---

## 🚨 Troubleshooting

### API ne répond pas
```bash
# Vérifier le statut PM2
pm2 status

# Voir les logs
pm2 logs quelia-api

# Redémarrer
pm2 restart quelia-api
```

### Erreur de connexion PostgreSQL
```bash
# Vérifier que PostgreSQL est actif
sudo systemctl status postgresql

# Tester la connexion
psql -U quelia_user -d quelia -h localhost
```

### Nginx erreur 502
```bash
# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log

# Vérifier que l'API tourne sur le bon port
curl http://localhost:3000/health
```

---

## 📊 Temps estimé total

| Phase | Durée |
|-------|-------|
| Préparation VPS | 2-3h |
| PostgreSQL | 1h |
| Export/Import données | 1-2h |
| Création backend API | 10-15h |
| Modification frontend | 8-12h |
| Déploiement | 3-4h |
| DNS & tests | 2-3h |
| **TOTAL** | **27-40h** |

---

## 💰 Coûts

| Item | Coût mensuel |
|------|--------------|
| VPS OVH (4GB) | 12€ |
| Domaine (si pas déjà) | 1€ |
| **TOTAL** | **~13€/mois** |

**Coût de développement** : 27-40h × 50-75€/h = **1350-3000€ one-time**

---

Bonne chance ! 🚀
