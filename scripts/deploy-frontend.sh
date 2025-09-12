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

# Check if we're in the correct directory
check_directory() {
    if [[ ! -f "frontend/package.json" ]]; then
        print_error "frontend/package.json not found. Please run this script from the project root."
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm ci
    cd ..
    print_success "Dependencies installed"
}

# Build the frontend
build_frontend() {
    print_status "Building frontend for production..."
    cd frontend
    
    # Set production environment variables for build
    export NODE_ENV=production
    export VITE_API_URL="${VITE_API_URL:-https://okaygoal-backend.railway.app/api/v1}"
    export VITE_WS_URL="${VITE_WS_URL:-wss://okaygoal-backend.railway.app/ws}"
    export VITE_APP_NAME="${VITE_APP_NAME:-OkayGoal}"
    export VITE_APP_VERSION="${VITE_APP_VERSION:-1.0.0}"
    export VITE_ENABLE_PWA="${VITE_ENABLE_PWA:-true}"
    
    npm run build
    cd ..
    print_success "Frontend built successfully"
}

# Run production tests
run_tests() {
    print_status "Running frontend tests..."
    cd frontend
    npm run test:coverage
    cd ..
    print_success "Tests passed"
}

# Validate build output
validate_build() {
    print_status "Validating build output..."
    
    if [[ ! -f "frontend/dist/index.html" ]]; then
        print_error "Build validation failed: index.html not found"
        exit 1
    fi
    
    if [[ ! -d "frontend/dist/assets" ]]; then
        print_error "Build validation failed: assets directory not found"
        exit 1
    fi
    
    # Check if PWA files exist
    if [[ ! -f "frontend/dist/manifest.json" ]]; then
        print_warning "manifest.json not found - PWA features may not work"
    fi
    
    if [[ ! -f "frontend/dist/sw.js" ]]; then
        print_warning "sw.js not found - PWA features may not work"
    fi
    
    # Check bundle size
    cd frontend/dist
    total_size=$(du -sh . | cut -f1)
    print_status "Total build size: $total_size"
    cd ../..
    
    print_success "Build validation passed"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI not found. Install with: npm install -g vercel"
        exit 1
    fi
    
    # Check if user is logged in
    if ! vercel whoami &> /dev/null; then
        print_warning "Please login to Vercel first: vercel login"
        exit 1
    fi
    
    # Deploy to production
    if [[ "${DEPLOY_PRODUCTION:-false}" == "true" ]]; then
        vercel --prod --confirm
        print_success "Deployed to production"
    else
        vercel --confirm
        print_success "Deployed to preview"
    fi
}

# Run lighthouse audit
run_lighthouse() {
    if [[ "${RUN_LIGHTHOUSE:-false}" == "true" ]]; then
        print_status "Running Lighthouse audit..."
        
        if command -v lighthouse &> /dev/null; then
            lighthouse --chrome-flags="--headless" \
                      --output=html \
                      --output-path=./lighthouse-report.html \
                      --view \
                      "${SITE_URL:-http://localhost:3000}"
            print_success "Lighthouse audit completed"
        else
            print_warning "Lighthouse not found. Skipping audit."
        fi
    fi
}

# Generate sitemap (if needed)
generate_sitemap() {
    print_status "Generating sitemap..."
    
    # Create a basic sitemap.xml
    cat > frontend/dist/sitemap.xml << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://okaygoal.vercel.app/</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://okaygoal.vercel.app/matches</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://okaygoal.vercel.app/competitions</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://okaygoal.vercel.app/teams</loc>
    <lastmod>$(date +%Y-%m-%d)</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
EOF

    # Create robots.txt
    cat > frontend/dist/robots.txt << EOF
User-agent: *
Allow: /

# Sitemap
Sitemap: https://okaygoal.vercel.app/sitemap.xml
EOF

    print_success "SEO files generated"
}

# Main deployment function
main() {
    echo "🌐 OkayGoal Frontend Deployment"
    echo "==============================="
    
    check_directory
    install_dependencies
    
    if [[ "${SKIP_TESTS:-false}" != "true" ]]; then
        run_tests
    fi
    
    build_frontend
    validate_build
    generate_sitemap
    
    if [[ "${VERCEL_DEPLOY:-true}" == "true" ]]; then
        deploy_to_vercel
    else
        print_warning "Skipping Vercel deployment (VERCEL_DEPLOY=false)"
    fi
    
    run_lighthouse
    
    print_success "🎉 Frontend deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. Test the deployed application"
    echo "2. Check Vercel analytics and performance"
    echo "3. Monitor Core Web Vitals"
    echo "4. Set up custom domain if needed"
    echo "5. Configure CDN and caching"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"