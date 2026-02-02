const jwt = require('jsonwebtoken');

/**
 * Middleware d'authentification JWT
 * Vérifie le token dans le header Authorization
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Vérifier si le header Authorization existe
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentification requise',
      message: 'Token manquant ou invalide'
    });
  }

  // Extraire le token (retirer "Bearer ")
  const token = authHeader.substring(7);

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajouter les infos utilisateur à la requête
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    // Passer au middleware suivant
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expiré',
        message: 'Veuillez vous reconnecter'
      });
    }

    return res.status(401).json({
      error: 'Token invalide',
      message: 'Authentification échouée'
    });
  }
};

/**
 * Middleware pour vérifier le rôle de l'utilisateur
 * @param {string} requiredRole - Rôle requis (ex: 'admin', 'super_admin')
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Non authentifié'
      });
    }

    if (req.user.role !== requiredRole && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: 'Accès refusé',
        message: `Rôle ${requiredRole} requis`
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole
};
