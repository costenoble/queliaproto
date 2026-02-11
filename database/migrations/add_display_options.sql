-- Migration : Ajout des options d'affichage POI
-- Les 3 colonnes permettent de masquer individuellement
-- les icônes signalement/newsletter dans le popup POI.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_email_report BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_voice_report BOOLEAN DEFAULT true;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS show_newsletter BOOLEAN DEFAULT true;
