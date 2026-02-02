#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script d'envoi de données temps réel vers la plateforme Quelia
Version 1.0
"""

import requests
import time
from datetime import datetime
import sys

# ============================================
# CONFIGURATION (fournie par Quelia)
# ============================================
# Ces valeurs vous seront communiquées par email
URL = "https://msqisigttxosvnxfhfdn.supabase.co/rest/v1/rpc/insert_live_data"
API_KEY = "VOTRE_CLE_API"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcWlzaWd0dHhvc3ZueGZoZmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MTM2NDYsImV4cCI6MjA4NDM4OTY0Nn0.Idzca71FzW4SVlKlqHOsbh3JvMfzYH-jpCJP22rzSQ8"

# Paramètres d'envoi
FREQUENCE_ENVOI = 5  # Secondes entre chaque envoi
UNITE = "kW"         # Unité de votre donnée (kW, m³/h, °C, etc.)

# ============================================
# PARTIE À MODIFIER : Lecture de votre donnée
# ============================================


def lire_ma_donnee():
    """
    FONCTION À MODIFIER selon votre installation.

    Cette fonction doit retourner la valeur actuelle à envoyer.

    Exemples d'implémentation selon votre cas :

    1) Lecture d'un fichier CSV :
       import csv
       with open('/chemin/vers/donnees.csv', 'r') as f:
           reader = csv.reader(f)
           lignes = list(reader)
           valeur = float(lignes[-1][1])  # Dernière ligne, 2ème colonne
       return valeur

    2) Appel à une API locale :
       response = requests.get('http://192.168.1.100/api/production')
       data = response.json()
       return data['current_power']

    3) Lecture d'une base de données :
       import sqlite3
       conn = sqlite3.connect('/path/to/db.sqlite')
       cursor = conn.cursor()
       cursor.execute("SELECT valeur FROM mesures ORDER BY date DESC LIMIT 1")
       valeur = cursor.fetchone()[0]
       conn.close()
       return valeur
    """

    # EXEMPLE : Valeur fixe (À REMPLACER PAR VOTRE VRAIE LECTURE)
    valeur = 42.5

    # TODO : Remplacer la ligne ci-dessus par votre vraie lecture

    return valeur

# ============================================
# NE PAS MODIFIER CI-DESSOUS
# ============================================


def verifier_configuration():
    """Vérifie que la configuration est complète"""
    if "XXXXX" in URL or "VOTRE" in API_KEY:
        print("❌ ERREUR : Configuration incomplète !")
        print("Veuillez remplacer URL, API_KEY et SUPABASE_KEY par les vraies valeurs.")
        sys.exit(1)


def envoyer_donnee():
    """Envoie la donnée vers la plateforme"""
    try:
        valeur = lire_ma_donnee()

        response = requests.post(
            URL,
            json={
                "p_api_key": API_KEY,
                "p_value": float(valeur),
                "p_unit": UNITE
            },
            headers={
                "apikey": SUPABASE_KEY,
                "Content-Type": "application/json"
            },
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(
                    f"✅ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Envoyé : {valeur} {UNITE}")
                return True
            else:
                print(f"❌ Erreur : {result.get('error', 'Erreur inconnue')}")
                return False
        else:
            print(f"❌ Erreur HTTP {response.status_code} : {response.text}")
            return False

    except requests.exceptions.Timeout:
        print(f"⚠️  Timeout - Tentative de reconnexion...")
        return False
    except requests.exceptions.ConnectionError:
        print(f"⚠️  Pas de connexion Internet - Tentative de reconnexion...")
        return False
    except Exception as e:
        print(f"❌ Erreur : {e}")
        return False


def main():
    """Boucle principale d'envoi"""
    print("=" * 60)
    print("  Script d'envoi de données - Plateforme Quelia")
    print("=" * 60)
    print()

    verifier_configuration()

    print(f"📡 Fréquence d'envoi : toutes les {FREQUENCE_ENVOI} secondes")
    print(f"📊 Unité : {UNITE}")
    print(f"🔑 API Key : {API_KEY[:15]}...")
    print()
    print("Démarrage... (Ctrl+C pour arrêter)")
    print()

    while True:
        envoyer_donnee()
        time.sleep(FREQUENCE_ENVOI)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Arrêt du script.")
        sys.exit(0)
