const express = require('express');
const router = express.Router();

// État interne de la simulation éolienne
let valeurActuelle = 8;       // MW de départ
let direction = 1;            // 1 = monte, -1 = descend
const MIN_MW = 3;
const MAX_MW = 15;

// Met à jour la valeur toutes les 5 secondes
setInterval(() => {
  valeurActuelle += direction;

  // Inverse la direction aux bornes
  if (valeurActuelle >= MAX_MW) direction = -1;
  if (valeurActuelle <= MIN_MW) direction = 1;
}, 5000);

// GET /api/demo/eolienne
// Retourne la puissance actuelle de la station éolienne en MW
router.get('/eolienne', (req, res) => {
  res.json({
    current_power: valeurActuelle,
    unit: 'MW',
    station: 'Parc éolien démo',
    min: MIN_MW,
    max: MAX_MW,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
