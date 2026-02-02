const { Pool } = require('pg');

// Debug: vérifier que les variables sont chargées
if (process.env.NODE_ENV === 'development') {
  console.log('📌 Config DB:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? '***' : 'MISSING'
  });
}

// Configuration de la connexion PostgreSQL
// Parametres separes pour Supabase (le point dans le username pose probleme avec connection string)
const pool = new Pool({
  host: process.env.DB_HOST || 'aws-1-eu-central-2.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '6543'),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.msqisigttxosvnxfhfdn',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Gestion des erreurs du pool
pool.on('error', (err, client) => {
  console.error('Erreur inattendue sur un client PostgreSQL inactif:', err);
  process.exit(-1);
});

// Fonction helper pour exécuter des requêtes
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Requête exécutée:', { text, duration, rows: res.rowCount });
    }

    return res;
  } catch (error) {
    console.error('Erreur de requête:', error);
    throw error;
  }
};

// Fonction pour récupérer un client (pour les transactions)
const getClient = () => {
  return pool.connect();
};

// Test de connexion au démarrage
const testConnection = async () => {
  try {
    const res = await query('SELECT NOW()');
    console.log('✅ Connexion PostgreSQL établie:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion PostgreSQL:', error.message);
    return false;
  }
};

// Appel du test de connexion
testConnection();

module.exports = {
  query,
  pool,
  getClient
};
