const express = require('express');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/clients
 * Récupérer tous les clients (protégé)
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM clients ORDER BY name ASC'
    );

    res.json(result.rows);

  } catch (error) {
    console.error('Erreur GET /clients:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des clients'
    });
  }
});

/**
 * GET /api/clients/by-slug/:slug
 * Récupérer un client par son slug (public)
 */
router.get('/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await db.query(
      'SELECT * FROM clients WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erreur GET /clients/by-slug/:slug:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du client'
    });
  }
});

/**
 * GET /api/clients/:id
 * Récupérer un client par ID (protégé)
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erreur GET /clients/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du client'
    });
  }
});

/**
 * POST /api/clients
 * Créer un nouveau client (super_admin uniquement)
 */
router.post('/', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, slug, logo_url } = req.body;

    // Validation
    if (!name || !slug) {
      return res.status(400).json({
        error: 'Nom et slug sont requis'
      });
    }

    // Vérifier si le slug existe déjà
    const existing = await db.query(
      'SELECT id FROM clients WHERE slug = $1',
      [slug]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: 'Ce slug est déjà utilisé'
      });
    }

    const result = await db.query(
      `INSERT INTO clients (name, slug, logo_url, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [name, slug, logo_url]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erreur POST /clients:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du client'
    });
  }
});

/**
 * PUT /api/clients/:id
 * Modifier un client (super_admin uniquement)
 */
router.put('/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, logo_url } = req.body;

    const result = await db.query(
      `UPDATE clients SET
        name = $1, slug = $2, logo_url = $3
       WHERE id = $4
       RETURNING *`,
      [name, slug, logo_url, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erreur PUT /clients/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la modification du client'
    });
  }
});

/**
 * DELETE /api/clients/:id
 * Supprimer un client (super_admin uniquement)
 */
router.delete('/:id', authMiddleware, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des projets associés
    const projects = await db.query(
      'SELECT COUNT(*) FROM projects WHERE client_id = $1',
      [id]
    );

    if (parseInt(projects.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Impossible de supprimer un client ayant des projets associés'
      });
    }

    const result = await db.query(
      'DELETE FROM clients WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Client non trouvé'
      });
    }

    res.json({
      message: 'Client supprimé avec succès',
      client: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur DELETE /clients/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du client'
    });
  }
});

module.exports = router;
