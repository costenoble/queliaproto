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

  // Générer une valeur aléatoire entre 10 et 50 MW
  const randomPower = (Math.random() * 40 + 10).toFixed(2);

  // Réponse JSON simple
  const response = {
    current_power: parseFloat(randomPower),
    timestamp: new Date().toISOString(),
    status: 'ok'
  };

  console.log(`[${new Date().toLocaleTimeString()}] Requête reçue → Réponse: ${randomPower} MW`);

  res.writeHead(200);
  res.end(JSON.stringify(response));
});

server.listen(PORT, () => {
  console.log(`\n🚀 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log(`\n📋 Configuration pour l'admin :`);
  console.log(`   URL API JSON : http://localhost:${PORT}`);
  console.log(`   Chemin JSON  : current_power`);
  console.log(`\n💡 Les valeurs changent à chaque requête (10-50 MW aléatoire)\n`);
  console.log(`Appuyez sur Ctrl+C pour arrêter le serveur\n`);
});
