# Installation PostgreSQL sur VPS

Guide rapide pour configurer PostgreSQL sur un VPS (Ubuntu/Debian).

## 1. Connexion au VPS

```bash
ssh root@votre-ip-vps
```

## 2. Installation PostgreSQL

```bash
# Mise a jour
apt update && apt upgrade -y

# Installation PostgreSQL
apt install postgresql postgresql-contrib -y

# Verifier que ca tourne
systemctl status postgresql
```

## 3. Configuration de la base

```bash
# Se connecter en tant que postgres
sudo -u postgres psql

# Dans le shell PostgreSQL:
```

```sql
-- Creer l'utilisateur
CREATE USER quelia_user WITH PASSWORD 'votre_mot_de_passe_securise';

-- Creer la base
CREATE DATABASE quelia OWNER quelia_user;

-- Donner les droits
GRANT ALL PRIVILEGES ON DATABASE quelia TO quelia_user;

-- Quitter
\q
```

## 4. Autoriser les connexions distantes

```bash
# Editer postgresql.conf
nano /etc/postgresql/*/main/postgresql.conf
```

Trouver et modifier:
```
listen_addresses = '*'
```

```bash
# Editer pg_hba.conf
nano /etc/postgresql/*/main/pg_hba.conf
```

Ajouter a la fin:
```
# Connexions depuis l'exterieur (remplacer par votre IP si possible)
host    quelia    quelia_user    0.0.0.0/0    scram-sha-256
```

```bash
# Redemarrer PostgreSQL
systemctl restart postgresql
```

## 5. Ouvrir le port firewall

```bash
# Si vous utilisez ufw
ufw allow 5432/tcp
ufw reload
```

## 6. Tester la connexion

Depuis votre machine locale:
```bash
psql "postgresql://quelia_user:votre_password@votre-ip-vps:5432/quelia"
```

## 7. Appliquer le schema

```bash
# Depuis le dossier du projet
psql "postgresql://quelia_user:votre_password@votre-ip-vps:5432/quelia" -f database/schema-vps.sql
```

## 8. Migrer les donnees depuis Supabase

```bash
cd database
./migrate-from-supabase.sh
```

Choisir l'option 4 pour une migration complete.

## 9. Configurer le backend

```bash
cd backend
cp .env.example .env
nano .env
```

Modifier:
```
DATABASE_URL=postgresql://quelia_user:votre_password@votre-ip-vps:5432/quelia
NODE_ENV=production
```

## 10. Lancer le backend

```bash
npm install
npm start
```

Pour le lancer en arriere-plan avec PM2:
```bash
npm install -g pm2
pm2 start src/server.js --name quelia-api
pm2 save
pm2 startup
```

---

## Securite recommandee

1. **Changer le port SSH** (optionnel mais recommande)
2. **Configurer fail2ban** contre les attaques brute-force
3. **Limiter les IPs** dans pg_hba.conf si possible
4. **Utiliser un reverse proxy** (nginx) avec HTTPS
5. **Backups automatiques** avec pg_dump + cron

## Commandes utiles

```bash
# Voir les logs PostgreSQL
tail -f /var/log/postgresql/postgresql-*-main.log

# Backup manuel
pg_dump -U quelia_user -h localhost quelia > backup.sql

# Restaurer
psql -U quelia_user -h localhost quelia < backup.sql

# Voir les connexions actives
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname='quelia';"
```
