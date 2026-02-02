# Version courte - Email client

---

**Objet :** Affichage temps réel de vos données sur la carte - Configuration nécessaire

---

Bonjour [Nom],

Bonne nouvelle ! Nous avons ajouté une fonctionnalité qui permet d'afficher **la puissance actuelle** de votre installation directement sur la carte, avec mise à jour automatique toutes les 5 secondes.

## 🎯 Ce que vos visiteurs verront :

Sur la fiche de votre projet, ils verront :
- Une icône ⚡ animée "Temps réel"
- La puissance actuelle : `42.5 MW` (exemple)
- La valeur se met à jour automatiquement

## 📋 Ce dont nous avons besoin :

Pour activer cette fonctionnalité, vous devez nous fournir **une URL API** qui retourne les données de votre installation au format JSON.

### Format attendu (le plus simple) :
```json
{
  "current_power": 42.5
}
```

### Informations à nous communiquer :

1. **URL de l'API**
   Exemple : `https://monitoring.votresite.com/centrale-123/power`

2. **Chemin vers la valeur**
   - Si JSON simple : `current_power`
   - Si JSON complexe : `data.measurements.power`

3. **Unité**
   - kW, MW, ou Nm3/h ?

4. **Clé d'authentification** (si nécessaire)
   - Votre API nécessite-t-elle une clé d'accès ?

## ✅ Actions de votre côté :

**Option A** - Vous avez déjà un système de monitoring :
→ Demandez à votre prestataire technique l'URL de l'API

**Option B** - Vous n'avez pas encore d'API :
→ Appelons-nous pour discuter de la meilleure solution

## 🧪 Comment tester si votre API fonctionne ?

Ouvrez simplement l'URL dans votre navigateur :
- ✅ Vous voyez du JSON → Parfait !
- ❌ Vous voyez une page HTML ou une erreur → Il faut la configurer

---

**Besoin d'aide ?** Je suis disponible pour un appel de 15 minutes afin de vous expliquer en détail.

📧 [votre.email@quelia.fr]
📱 [votre numéro]

Bien cordialement,

[Votre nom]

---

**P.S.** : Si vous voulez voir un exemple concret de ce que ça donne, je peux vous montrer une démo lors de notre prochain échange.
