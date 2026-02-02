#!/bin/bash

# ============================================
# QUELIA - Script de migration Supabase -> VPS
# ============================================

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================"
echo "   QUELIA - Migration Supabase -> VPS"
echo "============================================"
echo -e "${NC}"

# ============================================
# CONFIGURATION
# ============================================

# Supabase (source)
SUPABASE_HOST="aws-1-eu-central-2.pooler.supabase.com"
SUPABASE_PORT="6543"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.msqisigttxosvnxfhfdn"
# Le mot de passe sera demande interactivement

# VPS (destination) - A configurer
VPS_HOST="${VPS_HOST:-localhost}"
VPS_PORT="${VPS_PORT:-5432}"
VPS_DB="${VPS_DB:-quelia}"
VPS_USER="${VPS_USER:-quelia_user}"

# Fichiers
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/supabase_backup_${TIMESTAMP}.sql"
DATA_ONLY_FILE="${BACKUP_DIR}/supabase_data_${TIMESTAMP}.sql"

# ============================================
# FONCTIONS
# ============================================

print_step() {
    echo -e "\n${GREEN}[ETAPE]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[ATTENTION]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERREUR]${NC} $1"
}

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 n'est pas installe. Installez-le avant de continuer."
        exit 1
    fi
}

# ============================================
# VERIFICATION DES PREREQUIS
# ============================================

print_step "Verification des prerequis..."

check_command "pg_dump"
check_command "psql"

mkdir -p "$BACKUP_DIR"
print_info "Dossier de backup: $BACKUP_DIR"

# ============================================
# MENU PRINCIPAL
# ============================================

echo -e "\n${YELLOW}Que voulez-vous faire ?${NC}"
echo "1) Exporter les donnees de Supabase (pg_dump)"
echo "2) Creer le schema sur le VPS"
echo "3) Importer les donnees sur le VPS"
echo "4) Migration complete (1 + 2 + 3)"
echo "5) Creer un utilisateur admin"
echo "6) Quitter"
echo ""
read -p "Votre choix [1-6]: " CHOICE

case $CHOICE in
    1)
        # ============================================
        # EXPORT SUPABASE
        # ============================================
        print_step "Export des donnees depuis Supabase..."

        print_warning "Entrez votre mot de passe Supabase (celui entre crochets dans la connection string)"
        read -sp "Mot de passe: " SUPABASE_PASSWORD
        echo ""

        export PGPASSWORD="$SUPABASE_PASSWORD"

        print_info "Connexion a Supabase..."
        print_info "Host: $SUPABASE_HOST:$SUPABASE_PORT"

        # Export des donnees uniquement (tables projects et clients)
        pg_dump "postgresql://${SUPABASE_USER}:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}?sslmode=require" \
            --data-only \
            --no-owner \
            --no-acl \
            --table=public.projects \
            --table=public.clients \
            -f "$DATA_ONLY_FILE" 2>/dev/null || {
                print_error "Echec de l'export. Verifiez vos identifiants."
                exit 1
            }

        unset PGPASSWORD

        print_info "Donnees exportees vers: $DATA_ONLY_FILE"
        print_info "Taille: $(du -h "$DATA_ONLY_FILE" | cut -f1)"

        echo -e "\n${GREEN}Export termine avec succes!${NC}"
        ;;

    2)
        # ============================================
        # CREATION SCHEMA VPS
        # ============================================
        print_step "Creation du schema sur le VPS..."

        print_info "Configuration VPS:"
        print_info "  Host: $VPS_HOST:$VPS_PORT"
        print_info "  Database: $VPS_DB"
        print_info "  User: $VPS_USER"

        read -sp "Mot de passe VPS: " VPS_PASSWORD
        echo ""

        export PGPASSWORD="$VPS_PASSWORD"

        print_info "Application du schema..."

        psql "postgresql://${VPS_USER}:${VPS_PASSWORD}@${VPS_HOST}:${VPS_PORT}/${VPS_DB}" \
            -f "${SCRIPT_DIR}/schema-vps.sql" || {
                print_error "Echec de creation du schema."
                exit 1
            }

        unset PGPASSWORD

        echo -e "\n${GREEN}Schema cree avec succes!${NC}"
        ;;

    3)
        # ============================================
        # IMPORT DONNEES VPS
        # ============================================
        print_step "Import des donnees sur le VPS..."

        # Trouver le dernier fichier de backup
        LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/supabase_data_*.sql 2>/dev/null | head -1)

        if [ -z "$LATEST_BACKUP" ]; then
            print_error "Aucun fichier de backup trouve. Executez d'abord l'option 1."
            exit 1
        fi

        print_info "Fichier a importer: $LATEST_BACKUP"

        print_info "Configuration VPS:"
        print_info "  Host: $VPS_HOST:$VPS_PORT"
        print_info "  Database: $VPS_DB"
        print_info "  User: $VPS_USER"

        read -sp "Mot de passe VPS: " VPS_PASSWORD
        echo ""

        export PGPASSWORD="$VPS_PASSWORD"

        print_info "Import des donnees..."

        psql "postgresql://${VPS_USER}:${VPS_PASSWORD}@${VPS_HOST}:${VPS_PORT}/${VPS_DB}" \
            -f "$LATEST_BACKUP" || {
                print_error "Echec de l'import."
                exit 1
            }

        unset PGPASSWORD

        echo -e "\n${GREEN}Import termine avec succes!${NC}"
        ;;

    4)
        # ============================================
        # MIGRATION COMPLETE
        # ============================================
        print_step "Migration complete..."

        print_warning "Cette option va:"
        print_warning "  1. Exporter les donnees de Supabase"
        print_warning "  2. Creer le schema sur votre VPS"
        print_warning "  3. Importer les donnees"
        echo ""
        read -p "Continuer? (o/n): " CONFIRM

        if [ "$CONFIRM" != "o" ] && [ "$CONFIRM" != "O" ]; then
            print_info "Migration annulee."
            exit 0
        fi

        # Demander les mots de passe une seule fois
        print_warning "Entrez votre mot de passe Supabase:"
        read -sp "Mot de passe Supabase: " SUPABASE_PASSWORD
        echo ""

        print_warning "Entrez votre mot de passe VPS:"
        read -sp "Mot de passe VPS: " VPS_PASSWORD
        echo ""

        # ETAPE 1: Export
        print_step "1/3 - Export Supabase..."
        export PGPASSWORD="$SUPABASE_PASSWORD"

        pg_dump "postgresql://${SUPABASE_USER}:${SUPABASE_PASSWORD}@${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}?sslmode=require" \
            --data-only \
            --no-owner \
            --no-acl \
            --table=public.projects \
            --table=public.clients \
            -f "$DATA_ONLY_FILE" 2>/dev/null || {
                print_error "Echec de l'export Supabase."
                exit 1
            }

        print_info "Export OK: $DATA_ONLY_FILE"

        # ETAPE 2: Schema VPS
        print_step "2/3 - Creation schema VPS..."
        export PGPASSWORD="$VPS_PASSWORD"

        psql "postgresql://${VPS_USER}:${VPS_PASSWORD}@${VPS_HOST}:${VPS_PORT}/${VPS_DB}" \
            -f "${SCRIPT_DIR}/schema-vps.sql" 2>/dev/null || {
                print_error "Echec creation schema."
                exit 1
            }

        print_info "Schema OK"

        # ETAPE 3: Import
        print_step "3/3 - Import donnees..."

        psql "postgresql://${VPS_USER}:${VPS_PASSWORD}@${VPS_HOST}:${VPS_PORT}/${VPS_DB}" \
            -f "$DATA_ONLY_FILE" 2>/dev/null || {
                print_error "Echec import donnees."
                exit 1
            }

        unset PGPASSWORD

        echo -e "\n${GREEN}============================================${NC}"
        echo -e "${GREEN}   MIGRATION TERMINEE AVEC SUCCES!${NC}"
        echo -e "${GREEN}============================================${NC}"
        echo ""
        print_info "Prochaines etapes:"
        print_info "  1. Creez un utilisateur admin (option 5)"
        print_info "  2. Configurez le backend avec DATABASE_URL"
        print_info "  3. Lancez le backend: npm start"
        ;;

    5)
        # ============================================
        # CREER UTILISATEUR ADMIN
        # ============================================
        print_step "Creation d'un utilisateur admin..."

        read -p "Email: " ADMIN_EMAIL
        read -p "Nom complet: " ADMIN_NAME
        read -sp "Mot de passe: " ADMIN_PASSWORD
        echo ""

        print_info "Configuration VPS:"
        read -sp "Mot de passe PostgreSQL: " VPS_PASSWORD
        echo ""

        # Hash le mot de passe avec Node.js (bcrypt)
        print_info "Generation du hash bcrypt..."

        HASH=$(node -e "
            const bcrypt = require('bcrypt');
            const hash = bcrypt.hashSync('$ADMIN_PASSWORD', 10);
            console.log(hash);
        " 2>/dev/null) || {
            print_error "Node.js ou bcrypt non installe. Installez avec: npm install bcrypt"
            exit 1
        }

        export PGPASSWORD="$VPS_PASSWORD"

        psql "postgresql://${VPS_USER}:${VPS_PASSWORD}@${VPS_HOST}:${VPS_PORT}/${VPS_DB}" -c "
            INSERT INTO users (email, password_hash, full_name, role)
            VALUES ('$ADMIN_EMAIL', '$HASH', '$ADMIN_NAME', 'super_admin')
            ON CONFLICT (email) DO UPDATE SET
                password_hash = EXCLUDED.password_hash,
                full_name = EXCLUDED.full_name,
                role = EXCLUDED.role;
        " || {
            print_error "Echec creation utilisateur."
            exit 1
        }

        unset PGPASSWORD

        echo -e "\n${GREEN}Utilisateur admin cree!${NC}"
        print_info "Email: $ADMIN_EMAIL"
        print_info "Role: super_admin"
        ;;

    6)
        print_info "Au revoir!"
        exit 0
        ;;

    *)
        print_error "Choix invalide"
        exit 1
        ;;
esac

echo ""
