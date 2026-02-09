-- Migration: Ajout des champs d'impact et date de mise en exploitation
-- Date: 2026-02-09

-- Ajout de la date de mise en exploitation
ALTER TABLE projects ADD COLUMN IF NOT EXISTS commissioning_date DATE;

-- Ajout des champs d'impact environnemental
ALTER TABLE projects ADD COLUMN IF NOT EXISTS annual_production_mwh DECIMAL(12, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS co2_avoided_tons DECIMAL(12, 2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS households_equivalent INTEGER;

-- Commentaires pour documentation
COMMENT ON COLUMN projects.commissioning_date IS 'Date de mise en exploitation du projet';
COMMENT ON COLUMN projects.annual_production_mwh IS 'Productible annuel estimé en MWh/an';
COMMENT ON COLUMN projects.co2_avoided_tons IS 'CO2 évité par an en tonnes';
COMMENT ON COLUMN projects.households_equivalent IS 'Équivalent en nombre de foyers alimentés';
