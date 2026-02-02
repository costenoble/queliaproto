"""
Exemples de fonctions lire_ma_donnee() selon différents cas d'usage
Copiez-collez l'exemple qui correspond à votre situation dans envoi_donnees.py
"""

# =============================================================================
# EXEMPLE 1 : Lecture d'un fichier CSV mis à jour régulièrement
# =============================================================================
def lire_fichier_csv():
    import csv
    fichier = '/chemin/vers/production.csv'
    
    with open(fichier, 'r') as f:
        reader = csv.reader(f)
        lignes = list(reader)
        # Dernière ligne, 2ème colonne (adaptez selon votre format)
        valeur = float(lignes[-1][1])
    
    return valeur


# =============================================================================
# EXEMPLE 2 : Lecture d'un fichier texte simple
# =============================================================================
def lire_fichier_texte():
    fichier = '/chemin/vers/production.txt'
    
    with open(fichier, 'r') as f:
        contenu = f.read().strip()
        valeur = float(contenu)
    
    return valeur


# =============================================================================
# EXEMPLE 3 : Appel à une API HTTP locale (onduleur, automate, etc.)
# =============================================================================
def lire_api_locale():
    import requests
    
    url = 'http://192.168.1.50/api/production'  # IP de votre équipement
    response = requests.get(url, timeout=5)
    data = response.json()
    
    # Adaptez selon le format JSON de votre équipement
    valeur = data['production_instantanee']
    
    return valeur


# =============================================================================
# EXEMPLE 4 : Lecture Modbus TCP (automate industriel)
# =============================================================================
def lire_modbus():
    from pymodbus.client import ModbusTcpClient
    
    client = ModbusTcpClient('192.168.1.100', port=502)
    client.connect()
    
    # Lecture du registre 40001 (adaptez selon votre automate)
    result = client.read_holding_registers(40001, 1, slave=1)
    valeur = result.registers[0] / 10  # Division si valeur en dixièmes
    
    client.close()
    return valeur


# =============================================================================
# EXEMPLE 5 : Lecture d'une base de données SQLite
# =============================================================================
def lire_sqlite():
    import sqlite3
    
    conn = sqlite3.connect('/var/data/mesures.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT production_kw
        FROM mesures
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    
    valeur = cursor.fetchone()[0]
    conn.close()
    
    return valeur


# =============================================================================
# EXEMPLE 6 : Lecture d'une base de données PostgreSQL/MySQL
# =============================================================================
def lire_postgresql():
    import psycopg2  # ou pymysql pour MySQL
    
    conn = psycopg2.connect(
        host="localhost",
        database="monitoring",
        user="user",
        password="pass"
    )
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT production_kw
        FROM mesures
        ORDER BY timestamp DESC
        LIMIT 1
    """)
    
    valeur = cursor.fetchone()[0]
    conn.close()
    
    return valeur


# =============================================================================
# EXEMPLE 7 : Lecture d'une API cloud (SMA, Fronius, etc.)
# =============================================================================
def lire_api_cloud():
    import requests
    
    url = "https://api.solarweb.com/v1/plant/123/realtime"
    headers = {
        "Authorization": "Bearer VOTRE_TOKEN_API"
    }
    
    response = requests.get(url, headers=headers)
    data = response.json()
    
    valeur = data['current_power_kw']
    
    return valeur


# =============================================================================
# EXEMPLE 8 : Calcul à partir de plusieurs sources
# =============================================================================
def lire_multi_sources():
    import requests
    
    # Lecture de 3 onduleurs et somme des productions
    onduleur1 = requests.get('http://192.168.1.10/api/power').json()['value']
    onduleur2 = requests.get('http://192.168.1.11/api/power').json()['value']
    onduleur3 = requests.get('http://192.168.1.12/api/power').json()['value']
    
    total = onduleur1 + onduleur2 + onduleur3
    
    return total


# =============================================================================
# EXEMPLE 9 : Valeur aléatoire (pour tests uniquement)
# =============================================================================
def lire_aleatoire():
    import random
    
    # Simule une production entre 0 et 100 kW
    valeur = random.uniform(0, 100)
    
    return round(valeur, 2)
