#!/bin/bash

set -e

echo "🚀 Starting OkayGoal deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking required environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "API_FOOTBALL_KEY"
        "FRONTEND_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    print_status "Installing production dependencies..."
    
    if [[ ! -f "package.json" ]]; then
        print_error "package.json not found. Are you in the correct directory?"
        exit 1
    fi
    
    npm ci --only=production
    print_success "Dependencies installed"
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if database is accessible
    npm run db:test-connection || {
        print_error "Cannot connect to database"
        exit 1
    }
    
    npm run db:migrate
    print_success "Database migrations completed"
}

# Run health check
health_check() {
    print_status "Running application health check..."
    
    # Start the application in background
    npm run start:prod &
    SERVER_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Check health endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${PORT:-3001}/health || echo "000")
    
    if [[ "$response" == "200" ]]; then
        print_success "Health check passed"
        kill $SERVER_PID 2>/dev/null || true
    else
        print_error "Health check failed (HTTP $response)"
        kill $SERVER_PID 2>/dev/null || true
        exit 1
    fi
}

# Deploy to Railway
deploy_to_railway() {
    print_status "Deploying to Railway..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI not found. Install it with: npm install -g @railway/cli"
        exit 1
    fi
    
    # Deploy to production
    railway up --environment production
    print_success "Deployed to Railway"
}

# Main deployment function
main() {
    echo "🏈 OkayGoal Production Deployment"
    echo "=================================="
    
    check_env_vars
    install_dependencies
    build_application
    run_migrations
    health_check
    
    if [[ "${RAILWAY_DEPLOY:-true}" == "true" ]]; then
        deploy_to_railway
    else
        print_warning "Skipping Railway deployment (RAILWAY_DEPLOY=false)"
    fi
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify the application is running: curl https://your-app.railway.app/health"
    echo "2. Check logs: railway logs --environment production"
    echo "3. Configure custom domain if needed"
    echo "4. Set up monitoring alerts"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"