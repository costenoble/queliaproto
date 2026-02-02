#!/bin/bash

# ============================================
# QUELIA - Script de deploiement
# ============================================

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "============================================"
echo "   QUELIA - Deploiement VPS"
echo "============================================"
echo -e "${NC}"

# ============================================
# CONFIGURATION - A MODIFIER
# ============================================

VPS_USER="${VPS_USER:-root}"
VPS_HOST="${VPS_HOST:-votre-ip-ou-domaine}"
VPS_PATH="/var/www/quelia"

# Chemins locaux (relatifs au script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="${PROJECT_DIR}/frontend"
BACKEND_DIR="${PROJECT_DIR}/backend"

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

check_config() {
    if [ "$VPS_HOST" = "votre-ip-ou-domaine" ]; then
        print_error "Configurez VPS_HOST avant de lancer ce script!"
        print_info "Editez ce fichier ou exportez la variable:"
        print_info "  export VPS_HOST=votre-ip-vps"
        exit 1
    fi
}

# ============================================
# MENU
# ============================================

echo -e "${YELLOW}Que voulez-vous deployer ?${NC}"
echo "1) Frontend uniquement"
echo "2) Backend uniquement"
echo "3) Tout (Frontend + Backend)"
echo "4) Configuration nginx"
echo "5) Installation complete (premier deploiement)"
echo "6) Quitter"
echo ""
read -p "Votre choix [1-6]: " CHOICE

case $CHOICE in
    1)
        # ============================================
        # DEPLOYER FRONTEND
        # ============================================
        check_config

        print_step "Build du frontend..."
        cd "$FRONTEND_DIR"
        npm run build

        print_step "Envoi vers le VPS..."
        print_info "Destination: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/frontend"

        rsync -avz --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            "${FRONTEND_DIR}/dist/" \
            "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/frontend/"

        echo -e "\n${GREEN}Frontend deploye avec succes!${NC}"
        ;;

    2)
        # ============================================
        # DEPLOYER BACKEND
        # ============================================
        check_config

        print_step "Envoi du backend vers le VPS..."
        print_info "Destination: ${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend"

        rsync -avz --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.env' \
            "${BACKEND_DIR}/" \
            "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend/"

        print_step "Installation des dependances sur le VPS..."
        ssh "${VPS_USER}@${VPS_HOST}" "cd ${VPS_PATH}/backend && npm install --production"

        print_step "Redemarrage du backend..."
        ssh "${VPS_USER}@${VPS_HOST}" "pm2 restart quelia-api 2>/dev/null || pm2 start ${VPS_PATH}/backend/src/server.js --name quelia-api"

        echo -e "\n${GREEN}Backend deploye avec succes!${NC}"
        ;;

    3)
        # ============================================
        # DEPLOYER TOUT
        # ============================================
        check_config

        # Frontend
        print_step "1/4 - Build du frontend..."
        cd "$FRONTEND_DIR"
        npm run build

        print_step "2/4 - Envoi du frontend..."
        rsync -avz --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            "${FRONTEND_DIR}/dist/" \
            "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/frontend/"

        # Backend
        print_step "3/4 - Envoi du backend..."
        rsync -avz --delete \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.env' \
            "${BACKEND_DIR}/" \
            "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend/"

        print_step "4/4 - Installation et redemarrage..."
        ssh "${VPS_USER}@${VPS_HOST}" << 'ENDSSH'
            cd /var/www/quelia/backend
            npm install --production
            pm2 restart quelia-api 2>/dev/null || pm2 start src/server.js --name quelia-api
            pm2 save
ENDSSH

        echo -e "\n${GREEN}============================================${NC}"
        echo -e "${GREEN}   Deploiement complet termine!${NC}"
        echo -e "${GREEN}============================================${NC}"
        ;;

    4)
        # ============================================
        # CONFIG NGINX
        # ============================================
        check_config

        print_step "Envoi de la configuration nginx..."

        scp "${SCRIPT_DIR}/nginx-quelia.conf" "${VPS_USER}@${VPS_HOST}:/etc/nginx/sites-available/quelia"

        print_step "Activation et test..."
        ssh "${VPS_USER}@${VPS_HOST}" << 'ENDSSH'
            ln -sf /etc/nginx/sites-available/quelia /etc/nginx/sites-enabled/
            nginx -t && systemctl reload nginx
ENDSSH

        echo -e "\n${GREEN}Configuration nginx deployee!${NC}"
        print_warning "N'oubliez pas de modifier server_name dans la config nginx sur le VPS"
        ;;

    5)
        # ============================================
        # INSTALLATION COMPLETE (PREMIER DEPLOIEMENT)
        # ============================================
        check_config

        print_warning "Cette option va:"
        print_warning "  1. Creer les dossiers sur le VPS"
        print_warning "  2. Installer Node.js et PM2"
        print_warning "  3. Configurer nginx"
        print_warning "  4. Deployer frontend et backend"
        echo ""
        read -p "Continuer? (o/n): " CONFIRM

        if [ "$CONFIRM" != "o" ] && [ "$CONFIRM" != "O" ]; then
            exit 0
        fi

        print_step "1/6 - Preparation du VPS..."
        ssh "${VPS_USER}@${VPS_HOST}" << 'ENDSSH'
            # Mise a jour
            apt update

            # Installer Node.js 20
            if ! command -v node &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                apt install -y nodejs
            fi

            # Installer PM2
            npm install -g pm2

            # Installer nginx si absent
            apt install -y nginx

            # Creer les dossiers
            mkdir -p /var/www/quelia/frontend
            mkdir -p /var/www/quelia/backend
ENDSSH

        print_step "2/6 - Build du frontend..."
        cd "$FRONTEND_DIR"
        npm install
        npm run build

        print_step "3/6 - Envoi du frontend..."
        rsync -avz --delete \
            "${FRONTEND_DIR}/dist/" \
            "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/frontend/"

        print_step "4/6 - Envoi du backend..."
        rsync -avz --delete \
            --exclude='node_modules' \
            --exclude='.env' \
            "${BACKEND_DIR}/" \
            "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/backend/"

        print_step "5/6 - Configuration nginx..."
        scp "${SCRIPT_DIR}/nginx-quelia.conf" "${VPS_USER}@${VPS_HOST}:/etc/nginx/sites-available/quelia"

        print_step "6/6 - Finalisation..."
        ssh "${VPS_USER}@${VPS_HOST}" << ENDSSH
            # Backend
            cd ${VPS_PATH}/backend
            npm install --production

            # Nginx
            ln -sf /etc/nginx/sites-available/quelia /etc/nginx/sites-enabled/
            rm -f /etc/nginx/sites-enabled/default
            nginx -t && systemctl reload nginx

            # PM2 (ne demarre pas encore car pas de .env)
            echo "Backend pret. Configurez .env avant de demarrer."
ENDSSH

        echo -e "\n${GREEN}============================================${NC}"
        echo -e "${GREEN}   Installation complete!${NC}"
        echo -e "${GREEN}============================================${NC}"
        echo ""
        print_warning "Prochaines etapes manuelles:"
        echo "  1. Modifier server_name dans /etc/nginx/sites-available/quelia"
        echo "  2. Creer /var/www/quelia/backend/.env avec DATABASE_URL et JWT_SECRET"
        echo "  3. Lancer: pm2 start /var/www/quelia/backend/src/server.js --name quelia-api"
        echo "  4. Configurer SSL: certbot --nginx -d votre-domaine.fr"
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
