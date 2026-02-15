-- Migration : Ajout des URLs personnalisables par POI
-- Permet de configurer un lien vocal et newsletter différent pour chaque projet.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS voice_report_url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS newsletter_url TEXT;
