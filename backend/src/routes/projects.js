const express = require('express');
const db = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/projects
 * Récupérer tous les projets (public)
 * Query params: client_id, slug
 */
router.get('/', async (req, res) => {
  try {
    const { client_id, slug } = req.query;

    let query = `
      SELECT p.*,
             c.name as client_name,
             c.logo_url as client_logo_url,
             c.slug as client_slug
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
    `;

    let params = [];
    let whereConditions = [];

    if (client_id) {
      whereConditions.push(`p.client_id = $${params.length + 1}`);
      params.push(client_id);
    }

    if (slug) {
      whereConditions.push(`c.slug = $${params.length + 1}`);
      params.push(slug);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY p.created_at DESC';

    const result = await db.query(query, params);

    // Formater les résultats pour correspondre à l'ancien format Supabase
    const projects = result.rows.map(project => ({
      ...project,
      client: project.client_id ? {
        name: project.client_name,
        logo_url: project.client_logo_url,
        slug: project.client_slug
      } : null
    }));

    res.json(projects);

  } catch (error) {
    console.error('Erreur GET /projects:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des projets'
    });
  }
});

/**
 * GET /api/projects/:id
 * Récupérer un projet par ID (public)
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT p.*,
              c.name as client_name,
              c.logo_url as client_logo_url,
              c.slug as client_slug
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Projet non trouvé'
      });
    }

    const project = result.rows[0];

    // Formater pour correspondre à Supabase
    const formattedProject = {
      ...project,
      client: project.client_id ? {
        name: project.client_name,
        logo_url: project.client_logo_url,
        slug: project.client_slug
      } : null
    };

    res.json(formattedProject);

  } catch (error) {
    console.error('Erreur GET /projects/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération du projet'
    });
  }
});

/**
 * POST /api/projects
 * Créer un nouveau projet (protégé)
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      display_name,
      operator,
      poi_logo_url,
      energy_category,
      energy_subtype,
      status,
      commissioning_year,
      city,
      address,
      latitude,
      longitude,
      communes,
      intercommunalites,
      region,
      nominal_power,
      nominal_power_unit,
      actual_power,
      actual_power_unit,
      equivalent_display,
      live_data_url,
      live_data_path,
      description,
      url_type,
      project_url,
      client_id
    } = req.body;

    // Validation
    if (!name || !latitude || !longitude) {
      return res.status(400).json({
        error: 'Nom, latitude et longitude sont requis'
      });
    }

    const result = await db.query(
      `INSERT INTO projects (
        name, display_name, operator, poi_logo_url,
        energy_category, energy_subtype, status, commissioning_year,
        city, address, latitude, longitude,
        communes, intercommunalites, region,
        nominal_power, nominal_power_unit,
        actual_power, actual_power_unit,
        equivalent_display,
        live_data_url, live_data_path,
        description, url_type, project_url,
        client_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26,
        NOW(), NOW()
      ) RETURNING *`,
      [
        name, display_name, operator, poi_logo_url,
        energy_category, energy_subtype, status, commissioning_year,
        city, address, latitude, longitude,
        communes, intercommunalites, region,
        nominal_power, nominal_power_unit,
        actual_power, actual_power_unit,
        equivalent_display,
        live_data_url, live_data_path,
        description, url_type, project_url,
        client_id
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Erreur POST /projects:', error);
    res.status(500).json({
      error: 'Erreur lors de la création du projet'
    });
  }
});

/**
 * PUT /api/projects/:id
 * Modifier un projet (protégé)
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      display_name,
      operator,
      poi_logo_url,
      energy_category,
      energy_subtype,
      status,
      commissioning_year,
      city,
      address,
      latitude,
      longitude,
      communes,
      intercommunalites,
      region,
      nominal_power,
      nominal_power_unit,
      actual_power,
      actual_power_unit,
      equivalent_display,
      live_data_url,
      live_data_path,
      description,
      url_type,
      project_url,
      client_id
    } = req.body;

    const result = await db.query(
      `UPDATE projects SET
        name = $1, display_name = $2, operator = $3, poi_logo_url = $4,
        energy_category = $5, energy_subtype = $6, status = $7, commissioning_year = $8,
        city = $9, address = $10, latitude = $11, longitude = $12,
        communes = $13, intercommunalites = $14, region = $15,
        nominal_power = $16, nominal_power_unit = $17,
        actual_power = $18, actual_power_unit = $19,
        equivalent_display = $20,
        live_data_url = $21, live_data_path = $22,
        description = $23, url_type = $24, project_url = $25,
        client_id = $26, updated_at = NOW()
      WHERE id = $27
      RETURNING *`,
      [
        name, display_name, operator, poi_logo_url,
        energy_category, energy_subtype, status, commissioning_year,
        city, address, latitude, longitude,
        communes, intercommunalites, region,
        nominal_power, nominal_power_unit,
        actual_power, actual_power_unit,
        equivalent_display,
        live_data_url, live_data_path,
        description, url_type, project_url,
        client_id,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Projet non trouvé'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Erreur PUT /projects/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la modification du projet'
    });
  }
});

/**
 * DELETE /api/projects/:id
 * Supprimer un projet (protégé)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Projet non trouvé'
      });
    }

    res.json({
      message: 'Projet supprimé avec succès',
      project: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur DELETE /projects/:id:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression du projet'
    });
  }
});

module.exports = router;
