const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/auth/login
 * Authentification utilisateur
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis'
      });
    }

    // Récupérer l'utilisateur
    const result = await db.query(
      'SELECT id, email, password_hash, role, client_id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Identifiants invalides'
      });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        error: 'Identifiants invalides'
      });
    }

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        client_id: user.client_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Le token expire après 7 jours
    );

    // Retourner le token et les infos utilisateur
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        client_id: user.client_id
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur (optionnel)
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'user', client_id = null } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: 'Cet email est déjà utilisé'
      });
    }

    // Hash du mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Insérer l'utilisateur
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, client_id, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, email, role, client_id`,
      [email.toLowerCase(), passwordHash, role, client_id]
    );

    const newUser = result.rows[0];

    // Créer le token JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        client_id: newUser.client_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        client_id: newUser.client_id
      }
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/auth/me
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, role, client_id FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Erreur /me:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/auth/logout
 * Déconnexion (côté client, suppression du token)
 */
router.post('/logout', (req, res) => {
  // Avec JWT, la déconnexion se fait côté client (suppression du token)
  // Cette route est là pour la cohérence de l'API
  res.json({ message: 'Déconnexion réussie' });
});

module.exports = router;
