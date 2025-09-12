#!/bin/bash

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Generate secure JWT secrets
generate_jwt_secrets() {
    print_status "Generating JWT secrets..."
    
    JWT_SECRET=$(openssl rand -base64 64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    
    echo "JWT_SECRET=$JWT_SECRET"
    echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
}

# Generate VAPID keys for push notifications
generate_vapid_keys() {
    print_status "Generating VAPID keys for push notifications..."
    
    if command -v npx &> /dev/null; then
        npx web-push generate-vapid-keys --json | jq -r '"VAPID_PUBLIC_KEY=" + .publicKey, "VAPID_PRIVATE_KEY=" + .privateKey'
    else
        print_warning "npx not available. Please generate VAPID keys manually:"
        echo "npm install -g web-push"
        echo "web-push generate-vapid-keys"
    fi
}

# Set up Railway secrets
setup_railway_secrets() {
    print_status "Setting up Railway secrets..."
    
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Install with: npm install -g @railway/cli"
        return 1
    fi
    
    # Check if user is logged in
    if ! railway whoami &> /dev/null; then
        print_warning "Please login to Railway first: railway login"
        return 1
    fi
    
    print_status "Setting environment variables in Railway..."
    
    # Generate and set JWT secrets
    JWT_SECRET=$(openssl rand -base64 64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET"
    railway variables set JWT_EXPIRES_IN="15m"
    railway variables set JWT_REFRESH_EXPIRES_IN="7d"
    
    # Set other production variables
    railway variables set NODE_ENV="production"
    railway variables set API_VERSION="v1"
    railway variables set LOG_LEVEL="info"
    railway variables set LOG_FORMAT="json"
    railway variables set RATE_LIMIT_WINDOW_MS="900000"
    railway variables set RATE_LIMIT_MAX_REQUESTS="100"
    railway variables set ENABLE_PERFORMANCE_MONITORING="true"
    railway variables set HELMET_ENABLED="true"
    railway variables set CSRF_PROTECTION="true"
    
    print_success "Basic secrets configured in Railway"
    print_warning "Please set the following secrets manually in Railway dashboard:"
    echo "  - API_FOOTBALL_KEY (from RapidAPI)"
    echo "  - FRONTEND_URL (Vercel deployment URL)"
    echo "  - SENTRY_DSN (if using Sentry for error tracking)"
    echo "  - SMTP credentials (if using email notifications)"
}

# Set up Vercel secrets
setup_vercel_secrets() {
    print_status "Setting up Vercel environment variables..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Install with: npm install -g vercel"
        return 1
    fi
    
    print_status "Setting environment variables in Vercel..."
    
    # These will be set during Vercel deployment
    vercel env add VITE_API_URL production
    vercel env add VITE_WS_URL production
    vercel env add VITE_APP_NAME production
    vercel env add VITE_APP_VERSION production
    vercel env add VITE_ENABLE_PWA production
    vercel env add VITE_GOOGLE_ANALYTICS_ID production
    
    print_success "Vercel environment variables configured"
}

# Create local environment file
create_local_env() {
    print_status "Creating local .env.production file..."
    
    if [[ -f ".env.production" ]]; then
        print_warning ".env.production already exists. Creating backup..."
        cp .env.production .env.production.backup
    fi
    
    # Generate secrets
    JWT_SECRET=$(openssl rand -base64 64)
    JWT_REFRESH_SECRET=$(openssl rand -base64 64)
    
    cat > .env.production << EOF
# Generated on $(date)
NODE_ENV=production
PORT=3001
API_VERSION=v1

# Generated JWT secrets
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# TODO: Fill in these values
DATABASE_URL=postgresql://username:password@hostname:port/database
REDIS_URL=redis://username:password@hostname:port
API_FOOTBALL_KEY=your-api-football-rapidapi-key
FRONTEND_URL=https://okaygoal.vercel.app

# Performance & Monitoring
ENABLE_PERFORMANCE_MONITORING=true
LOG_LEVEL=info
LOG_FORMAT=json

# Security
HELMET_ENABLED=true
CSRF_PROTECTION=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache
REDIS_TTL_DEFAULT=3600
REDIS_TTL_MATCHES=300
REDIS_TTL_STANDINGS=1800

# WebSocket
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=10000
EOF

    print_success ".env.production file created"
    print_warning "Please update the TODO values in .env.production"
}

# Main function
main() {
    echo "🔐 OkayGoal Secrets Setup"
    echo "========================"
    
    case "${1:-local}" in
        "local")
            create_local_env
            ;;
        "railway")
            setup_railway_secrets
            ;;
        "vercel")
            setup_vercel_secrets
            ;;
        "all")
            create_local_env
            setup_railway_secrets
            setup_vercel_secrets
            ;;
        "generate")
            echo "# JWT Secrets"
            generate_jwt_secrets
            echo ""
            echo "# VAPID Keys"
            generate_vapid_keys
            ;;
        *)
            echo "Usage: $0 [local|railway|vercel|all|generate]"
            echo ""
            echo "  local   - Create local .env.production file"
            echo "  railway - Set up Railway environment variables"
            echo "  vercel  - Set up Vercel environment variables"
            echo "  all     - Set up all environments"
            echo "  generate- Generate secrets only"
            exit 1
            ;;
    esac
    
    print_success "Secrets setup completed!"
}

main "$@"