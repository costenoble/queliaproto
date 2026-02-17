-- Migration : Ajout des options d'affichage des cartes de données POI
-- Permet de masquer individuellement les cartes Capacité, Temps réel,
-- Foyers, Voitures, Production annuelle dans le popup et la page POI.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_capacity BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_realtime BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_households BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_cars BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_annual_production BOOLEAN DEFAULT true;
