-- Migration pour ajouter les champs de données en temps réel
-- À exécuter dans Supabase SQL Editor

-- Ajout des colonnes pour les données live
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS live_data_url TEXT,
ADD COLUMN IF NOT EXISTS live_data_path TEXT DEFAULT 'current_power';

-- Commentaires sur les colonnes
COMMENT ON COLUMN projects.live_data_url IS 'URL de l''API JSON qui retourne les données en temps réel';
COMMENT ON COLUMN projects.live_data_path IS 'Chemin JSON vers la valeur (ex: "current_power" ou "data.measurements.power")';
