-- ============================================
-- QUELIA - Configuration Multi-Tenant
-- À exécuter dans Supabase SQL Editor
-- ============================================

-- ============================================
-- ÉTAPE 1 : Créer la table des clients
-- ============================================

CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Index pour recherche rapide par slug
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);

-- ============================================
-- ÉTAPE 2 : Créer la table des profils utilisateurs
-- (Extension de auth.users de Supabase)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('super_admin', 'client')),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Index pour recherche par client
CREATE INDEX IF NOT EXISTS idx_user_profiles_client ON user_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ============================================
-- ÉTAPE 3 : Modifier la table projects existante
-- Ajouter la colonne client_id
-- ============================================

-- Vérifier si la colonne existe déjà avant de l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'client_id'
    ) THEN
        ALTER TABLE projects ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Index pour filtrer les projets par client
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);

-- ============================================
-- ÉTAPE 4 : Activer Row Level Security (RLS)
-- ============================================

-- Activer RLS sur les tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ÉTAPE 5 : Politiques de sécurité pour CLIENTS
-- ============================================

-- Super admin peut tout voir
CREATE POLICY "Super admin can view all clients" ON clients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'super_admin'
        )
    );

-- Super admin peut tout modifier
CREATE POLICY "Super admin can manage clients" ON clients
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'super_admin'
        )
    );

-- Client peut voir son propre client (entreprise)
CREATE POLICY "Client can view own company" ON clients
    FOR SELECT
    USING (
        id = (
            SELECT client_id FROM user_profiles
            WHERE user_profiles.id = auth.uid()
        )
    );

-- ============================================
-- ÉTAPE 6 : Politiques de sécurité pour USER_PROFILES
-- ============================================

-- Super admin voit tous les profils
CREATE POLICY "Super admin can view all profiles" ON user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS up
            WHERE up.id = auth.uid()
            AND up.role = 'super_admin'
        )
    );

-- Super admin peut gérer les profils
CREATE POLICY "Super admin can manage profiles" ON user_profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles AS up
            WHERE up.id = auth.uid()
            AND up.role = 'super_admin'
        )
    );

-- Utilisateur peut voir son propre profil
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT
    USING (id = auth.uid());

-- Utilisateur peut modifier son propre profil (sauf le rôle)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================
-- ÉTAPE 7 : Politiques de sécurité pour PROJECTS
-- ============================================

-- Lecture publique des projets (pour la carte publique)
CREATE POLICY "Public can view all projects" ON projects
    FOR SELECT
    USING (true);

-- Super admin peut tout gérer
CREATE POLICY "Super admin can manage all projects" ON projects
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'super_admin'
        )
    );

-- Client peut gérer ses propres projets
CREATE POLICY "Client can manage own projects" ON projects
    FOR ALL
    USING (
        client_id = (
            SELECT client_id FROM user_profiles
            WHERE user_profiles.id = auth.uid()
        )
    );

-- ============================================
-- ÉTAPE 8 : Fonction pour créer un profil automatiquement
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil à l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ÉTAPE 9 : Fonction utilitaire pour obtenir le rôle
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_client_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT client_id FROM user_profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ÉTAPE 10 : Créer le premier super admin (TOI)
-- ============================================

-- IMPORTANT : Remplace 'TON_USER_ID' par ton vrai user ID Supabase
-- Tu peux le trouver dans Supabase > Authentication > Users

-- INSERT INTO user_profiles (id, email, full_name, role)
-- VALUES (
--     'TON_USER_ID_ICI',
--     'ton@email.com',
--     'Ryan',
--     'super_admin'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

-- ============================================
-- ÉTAPE 11 : Créer un client de test
-- ============================================

-- INSERT INTO clients (name, slug, contact_email, description)
-- VALUES (
--     'Client Demo',
--     'client-demo',
--     'demo@client.com',
--     'Client de démonstration pour tester le multi-tenant'
-- );

-- ============================================
-- VUE UTILE : Projets avec info client
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
-- FIN DE LA CONFIGURATION
-- ============================================
