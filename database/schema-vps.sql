-- ============================================
-- QUELIA - Schema PostgreSQL pour VPS
-- Version simplifiee (sans multi-tenant)
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: users (authentification)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================
-- TABLE: clients (optionnel - pour organiser les projets)
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3b82f6',
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

-- ============================================
-- TABLE: projects (projets energetiques / POIs)
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Informations de base
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    operator VARCHAR(255),
    contact_email VARCHAR(255),
    poi_logo_url TEXT,

    -- Categorie energie
    energy_category VARCHAR(100),
    energy_subtype VARCHAR(100),

    -- Statut
    status VARCHAR(50) DEFAULT 'en etude',
    commissioning_year INTEGER,
    commissioning_date DATE,

    -- Localisation
    city VARCHAR(255),
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    communes TEXT,
    intercommunalites TEXT,
    region VARCHAR(255),

    -- Puissance
    nominal_power DECIMAL(10, 2),
    nominal_power_unit VARCHAR(20) DEFAULT 'MW',
    actual_power DECIMAL(10, 2),
    actual_power_unit VARCHAR(20) DEFAULT 'MW',
    equivalent_display TEXT,

    -- Impact et équivalents
    annual_production_mwh DECIMAL(12, 2),
    co2_avoided_tons DECIMAL(12, 2),
    households_equivalent INTEGER,

    -- Donnees temps reel
    live_data_url TEXT,
    live_data_path TEXT,

    -- Options d'affichage POI (actions)
    show_email_report BOOLEAN DEFAULT true,
    show_voice_report BOOLEAN DEFAULT true,
    show_newsletter BOOLEAN DEFAULT true,

    -- Options d'affichage POI (cartes données)
    show_capacity BOOLEAN DEFAULT true,
    show_realtime BOOLEAN DEFAULT true,
    show_cars BOOLEAN DEFAULT true,
    show_co2 BOOLEAN DEFAULT true,

    -- Autres
    description TEXT,
    url_type VARCHAR(50),
    project_url TEXT,

    -- Relation client (optionnel)
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_energy_category ON projects(energy_category);
CREATE INDEX IF NOT EXISTS idx_projects_coords ON projects(latitude, longitude);

-- ============================================
-- FONCTION: Mise a jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VUE: Projets avec info client
-- ============================================
CREATE OR REPLACE VIEW projects_with_client AS
SELECT
    p.*,
    c.name AS client_name,
    c.slug AS client_slug,
    c.logo_url AS client_logo
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id;

-- ============================================
-- DONNEE INITIALE: Premier utilisateur admin
-- ============================================
-- Mot de passe: changeme123 (a changer apres connexion!)
-- Hash genere avec bcrypt (10 rounds)

-- INSERT INTO users (email, password_hash, full_name, role)
-- VALUES (
--     'admin@quelia.fr',
--     '$2b$10$rQZ5QzXK8vHxXJz5Q5Q5QeQxQxQxQxQxQxQxQxQxQxQxQxQxQxQxQ',
--     'Admin Quelia',
--     'super_admin'
-- );

-- ============================================
-- FIN DU SCHEMA
-- ============================================
