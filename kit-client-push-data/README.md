# Kit d'envoi de données temps réel - Plateforme Quelia

## 📋 Vue d'ensemble

Ce kit permet d'envoyer automatiquement vos données de production/exploitation vers la plateforme Quelia pour affichage en temps réel sur la carte interactive.

---

## 🚀 Installation rapide

### Étape 1 : Installer Python

**Windows :**
1. Téléchargez Python depuis [python.org](https://www.python.org/downloads/)
2. Lors de l'installation, **cochez "Add Python to PATH"**
3. Ouvrez l'invite de commande et tapez :
   ```bash
   python --version
   ```

**Linux/Mac :**
```bash
sudo apt install python3 python3-pip  # Ubuntu/Debian
```

### Étape 2 : Installer les dépendances

```bash
pip install requests
```

ou

```bash
pip3 install requests
```

---

## ⚙️ Configuration

### 1. Ouvrir le fichier `envoi_donnees.py`

Avec un éditeur de texte (Notepad++, VS Code, ou bloc-notes).

### 2. Remplacer les valeurs de configuration

Nous vous fournirons ces valeurs par email sécurisé :

```python
URL = "https://xxxxx.supabase.co/rest/v1/rpc/insert_live_data"
API_KEY = "sk_live_xxxxxxxxxxxxx"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx"
```

### 3. Adapter la lecture de votre donnée

Modifiez la fonction `lire_ma_donnee()` selon votre installation.

**Exemple 1 : Lecture d'un fichier CSV**

```python
def lire_ma_donnee():
    import csv
    with open('/chemin/vers/production.csv', 'r') as f:
        reader = csv.reader(f)
        lignes = list(reader)
        valeur = float(lignes[-1][1])  # Dernière ligne, 2ème colonne
    return valeur
```

**Exemple 2 : Appel à une API locale (onduleur, automate...)**

```python
def lire_ma_donnee():
    response = requests.get('http://192.168.1.50/api/current_power')
    data = response.json()
    return data['power_kw']
```

**Exemple 3 : Lecture d'une base de données**

```python
def lire_ma_donnee():
    import sqlite3
    conn = sqlite3.connect('/var/data/mesures.db')
    cursor = conn.cursor()
    cursor.execute("SELECT production_kw FROM mesures ORDER BY timestamp DESC LIMIT 1")
    valeur = cursor.fetchone()[0]
    conn.close()
    return valeur
```

---

## ▶️ Lancement du script

### Test manuel

```bash
python envoi_donnees.py
```

ou

```bash
python3 envoi_donnees.py
```

Vous devriez voir :
```
📡 Fréquence d'envoi : toutes les 5 secondes
📊 Unité : kW
🔑 API Key : sk_live_xxxxxxx...

✅ 2024-01-15 14:30:00 | Envoyé : 42.5 kW
✅ 2024-01-15 14:30:05 | Envoyé : 43.2 kW
```

### Arrêter le script

Appuyez sur `Ctrl + C`

---

## 🔄 Lancement automatique au démarrage

### Windows (Planificateur de tâches)

1. Ouvrez le **Planificateur de tâches**
2. Créez une tâche de base
3. Déclencheur : **Au démarrage de l'ordinateur**
4. Action : **Démarrer un programme**
5. Programme : `python` ou `pythonw` (pour pas de fenêtre)
6. Argument : `C:\chemin\vers\envoi_donnees.py`
7. Cochez **Exécuter même si l'utilisateur n'est pas connecté**

### Linux (systemd)

Créez un fichier `/etc/systemd/system/quelia-data.service` :

```ini
[Unit]
Description=Envoi données Quelia
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/quelia-kit
ExecStart=/usr/bin/python3 /home/pi/quelia-kit/envoi_donnees.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Puis :

```bash
sudo systemctl enable quelia-data
sudo systemctl start quelia-data
sudo systemctl status quelia-data
```

---

## 🛠️ Dépannage

### Erreur : "Module requests not found"

```bash
pip install requests
```

### Erreur : "Configuration incomplète"

Vérifiez que vous avez bien remplacé `VOTRE_CLE_API` et `XXXXX` par les vraies valeurs.

### Pas de connexion Internet

Le script réessaiera automatiquement toutes les 5 secondes.

### Erreur : "Clé API invalide"

Contactez-nous pour vérifier votre clé API.

---

## 📞 Support

En cas de problème :

- **Email** : support@quelia.fr
- **Téléphone** : [VOTRE NUMÉRO]

---

## 📝 Notes

- Le script doit tourner en permanence
- Prévoyez un PC/serveur allumé 24/7
- Testez d'abord manuellement avant d'automatiser
- Les données sont envoyées toutes les 5 secondes (modifiable dans la config)

