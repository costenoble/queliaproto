# Deploiement Quelia sur VPS

## Fichiers

| Fichier | Description |
|---------|-------------|
| `deploy.sh` | Script de deploiement automatise |
| `nginx-quelia.conf` | Configuration nginx prete a l'emploi |

## Utilisation rapide

### 1. Configurer l'acces VPS

```bash
export VPS_HOST=votre-ip-ou-domaine
export VPS_USER=root  # optionnel, root par defaut
```

### 2. Premier deploiement

```bash
./deploy.sh
# Choisir option 5 (Installation complete)
```

### 3. Deploiements suivants

```bash
./deploy.sh
# Choisir option 1 (Frontend), 2 (Backend) ou 3 (Tout)
```

## Apres le premier deploiement

1. **Configurer nginx** sur le VPS:
   ```bash
   nano /etc/nginx/sites-available/quelia
   # Modifier server_name avec votre domaine
   nginx -t && systemctl reload nginx
   ```

2. **Creer le .env backend**:
   ```bash
   nano /var/www/quelia/backend/.env
   ```
   ```
   DATABASE_URL=postgresql://quelia_user:password@localhost:5432/quelia
   JWT_SECRET=votre_secret_tres_long
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://votre-domaine.fr
   ```

3. **Demarrer le backend**:
   ```bash
   pm2 start /var/www/quelia/backend/src/server.js --name quelia-api
   pm2 save
   pm2 startup
   ```

4. **Configurer SSL** (HTTPS):
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d votre-domaine.fr -d www.votre-domaine.fr
   ```

## Commandes utiles sur le VPS

```bash
# Voir les logs du backend
pm2 logs quelia-api

# Redemarrer le backend
pm2 restart quelia-api

# Status des services
pm2 status
systemctl status nginx
systemctl status postgresql

# Voir les logs nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Structure sur le VPS

```
/var/www/quelia/
├── frontend/          # Build React (fichiers statiques)
│   ├── index.html
│   ├── assets/
│   └── ...
└── backend/           # API Express
    ├── src/
    ├── package.json
    ├── .env           # A creer manuellement
    └── ...
```
