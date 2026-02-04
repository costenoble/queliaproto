// Serveur de test pour simuler une API de données en temps réel
// Lancer avec : node test-api-server.js

const http = require('http');

const PORT = 3001;

const server = http.createServer((req, res) => {
  // CORS headers pour autoriser les requêtes depuis le frontend
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  // Gérer les requêtes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Valeur basée sur le temps : monte de 1 MW par 5s entre 10 et 50, puis redescend
  const MIN = 10, MAX = 50;
  const RANGE = MAX - MIN;
  const CYCLE = RANGE * 2;
  const tick = Math.floor(Date.now() / 5000) % CYCLE;
  const position = tick <= RANGE ? tick : CYCLE - tick;
  const current_power = MIN + position;

  // Réponse JSON simple
  const response = {
    current_power,
    unit: 'MW',
    timestamp: new Date().toISOString(),
    status: 'ok'
  };

  console.log(`[${new Date().toLocaleTimeString()}] Requête reçue → Réponse: ${current_power} MW`);

  res.writeHead(200);
  res.end(JSON.stringify(response));
});

server.listen(PORT, () => {
  console.log(`\n🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`\n📋 Configuration pour l'admin :`);
  console.log(`   URL API JSON : http://localhost:${PORT}`);
  console.log(`   Chemin JSON  : current_power`);
  console.log(`\n💡 Valeur monte/descend de 1 MW toutes les 5s (10-50 MW)\n`);
  console.log(`Appuyez sur Ctrl+C pour arrêter le serveur\n`);
});
