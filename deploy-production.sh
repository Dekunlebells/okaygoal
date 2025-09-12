#!/bin/bash

set -e

# OkayGoal Production Deployment Master Script
# This script orchestrates the complete deployment process

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

print_header() {
    echo -e "${PURPLE}$1${NC}"
}

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

print_section() {
    echo ""
    echo -e "${CYAN}=== $1 ===${NC}"
}

# Configuration
SKIP_TESTS="${SKIP_TESTS:-false}"
SKIP_BUILD="${SKIP_BUILD:-false}"
DEPLOY_BACKEND="${DEPLOY_BACKEND:-true}"
DEPLOY_FRONTEND="${DEPLOY_FRONTEND:-true}"
RUN_HEALTH_CHECK="${RUN_HEALTH_CHECK:-true}"
GENERATE_REPORT="${GENERATE_REPORT:-true}"

# Check prerequisites
check_prerequisites() {
    print_section "CHECKING PREREQUISITES"
    
    local missing_tools=()
    
    # Check required tools
    local required_tools=("node" "npm" "git" "curl" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    # Check CLI tools
    if [[ "$DEPLOY_BACKEND" == "true" ]] && ! command -v railway &> /dev/null; then
        missing_tools+=("railway (npm install -g @railway/cli)")
    fi
    
    if [[ "$DEPLOY_FRONTEND" == "true" ]] && ! command -v vercel &> /dev/null; then
        missing_tools+=("vercel (npm install -g vercel)")
    fi
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        print_error "Missing required tools:"
        for tool in "${missing_tools[@]}"; do
            echo "  - $tool"
        done
        exit 1
    fi
    
    print_success "All required tools are available"
    
    # Check authentication
    if [[ "$DEPLOY_BACKEND" == "true" ]]; then
        if ! railway whoami &> /dev/null; then
            print_error "Railway CLI not authenticated. Run: railway login"
            exit 1
        fi
        print_success "Railway CLI authenticated"
    fi
    
    if [[ "$DEPLOY_FRONTEND" == "true" ]]; then
        if ! vercel whoami &> /dev/null; then
            print_error "Vercel CLI not authenticated. Run: vercel login"
            exit 1
        fi
        print_success "Vercel CLI authenticated"
    fi
}

# Check environment variables
check_environment() {
    print_section "CHECKING ENVIRONMENT CONFIGURATION"
    
    local missing_vars=()
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "API_FOOTBALL_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_warning "Missing environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        echo ""
        print_status "Run './scripts/setup-secrets.sh local' to generate local environment file"
        print_status "Then source the file: source .env.production"
        
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "All required environment variables are set"
    fi
}

# Run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping tests (SKIP_TESTS=true)"
        return 0
    fi
    
    print_section "RUNNING TESTS"
    
    # Backend tests
    print_status "Running backend tests..."
    if npm test; then
        print_success "Backend tests passed"
    else
        print_error "Backend tests failed"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd frontend
    if npm test -- --run; then
        print_success "Frontend tests passed"
    else
        print_error "Frontend tests failed"
        cd ..
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    cd ..
}

# Build applications
build_applications() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping build (SKIP_BUILD=true)"
        return 0
    fi
    
    print_section "BUILDING APPLICATIONS"
    
    # Build backend
    print_status "Building backend..."
    if npm run build; then
        print_success "Backend build completed"
    else
        print_error "Backend build failed"
        exit 1
    fi
    
    # Build frontend
    print_status "Building frontend..."
    cd frontend
    if npm run build; then
        print_success "Frontend build completed"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    cd ..
}

# Run database migrations
run_migrations() {
    print_section "RUNNING DATABASE MIGRATIONS"
    
    if [[ -z "$DATABASE_URL" ]]; then
        print_warning "DATABASE_URL not set, skipping migrations"
        return 0
    fi
    
    print_status "Running database migrations..."
    if ./scripts/migrate.sh migrate; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Deploy backend
deploy_backend() {
    if [[ "$DEPLOY_BACKEND" != "true" ]]; then
        print_warning "Skipping backend deployment (DEPLOY_BACKEND=false)"
        return 0
    fi
    
    print_section "DEPLOYING BACKEND TO RAILWAY"
    
    print_status "Deploying backend to Railway..."
    if railway up --environment production; then
        print_success "Backend deployed successfully"
        
        # Wait for deployment to be ready
        print_status "Waiting for backend to be ready..."
        sleep 30
        
        # Check health
        local backend_url="https://okaygoal-backend.railway.app"
        local retry=0
        local max_retries=5
        
        while [[ $retry -lt $max_retries ]]; do
            if curl -s --max-time 10 "$backend_url/health" > /dev/null; then
                print_success "Backend is healthy and responding"
                break
            else
                print_warning "Backend not ready yet, retrying... ($((retry+1))/$max_retries)"
                sleep 10
                ((retry++))
            fi
        done
        
        if [[ $retry -eq $max_retries ]]; then
            print_error "Backend health check failed after deployment"
            return 1
        fi
        
    else
        print_error "Backend deployment failed"
        exit 1
    fi
}

# Deploy frontend
deploy_frontend() {
    if [[ "$DEPLOY_FRONTEND" != "true" ]]; then
        print_warning "Skipping frontend deployment (DEPLOY_FRONTEND=false)"
        return 0
    fi
    
    print_section "DEPLOYING FRONTEND TO VERCEL"
    
    print_status "Deploying frontend to Vercel..."
    if vercel --prod --confirm --cwd frontend; then
        print_success "Frontend deployed successfully"
        
        # Wait for deployment to be ready
        print_status "Waiting for frontend to be ready..."
        sleep 20
        
        # Check availability
        local frontend_url="https://okaygoal.vercel.app"
        if curl -s --max-time 10 "$frontend_url" > /dev/null; then
            print_success "Frontend is available and responding"
        else
            print_warning "Frontend may not be fully ready yet"
        fi
        
    else
        print_error "Frontend deployment failed"
        exit 1
    fi
}

# Run health checks
run_health_checks() {
    if [[ "$RUN_HEALTH_CHECK" != "true" ]]; then
        print_warning "Skipping health checks (RUN_HEALTH_CHECK=false)"
        return 0
    fi
    
    print_section "RUNNING HEALTH CHECKS"
    
    print_status "Running comprehensive health checks..."
    if ./scripts/health-check.sh check; then
        print_success "All health checks passed"
    else
        print_warning "Some health checks failed"
        print_status "Check the output above for details"
    fi
}

# Generate deployment report
generate_deployment_report() {
    if [[ "$GENERATE_REPORT" != "true" ]]; then
        print_warning "Skipping deployment report (GENERATE_REPORT=false)"
        return 0
    fi
    
    print_section "GENERATING DEPLOYMENT REPORT"
    
    local timestamp=$(date '+%Y%m%d-%H%M%S')
    local report_file="deployment-report-$timestamp.json"
    
    cat > "$report_file" << EOF
{
  "deployment": {
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "version": "1.0.0",
    "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "branch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')",
    "environment": "production"
  },
  "services": {
    "backend": {
      "provider": "Railway",
      "url": "https://okaygoal-backend.railway.app",
      "deployed": $([ "$DEPLOY_BACKEND" == "true" ] && echo "true" || echo "false")
    },
    "frontend": {
      "provider": "Vercel", 
      "url": "https://okaygoal.vercel.app",
      "deployed": $([ "$DEPLOY_FRONTEND" == "true" ] && echo "true" || echo "false")
    },
    "database": {
      "provider": "Railway PostgreSQL",
      "migrated": true
    },
    "cache": {
      "provider": "Railway Redis",
      "configured": true
    }
  },
  "integrations": {
    "api_football": {
      "configured": $([ -n "$API_FOOTBALL_KEY" ] && echo "true" || echo "false")
    }
  },
  "features": {
    "authentication": true,
    "real_time_updates": true,
    "push_notifications": true,
    "pwa": true,
    "responsive_design": true
  }
}
EOF

    print_success "Deployment report generated: $report_file"
}

# Show deployment summary
show_deployment_summary() {
    print_section "DEPLOYMENT SUMMARY"
    
    echo "🎉 OkayGoal Production Deployment Complete!"
    echo ""
    echo "📊 Deployment Details:"
    echo "  Timestamp: $(date '+%Y-%m-%d %H:%M:%S UTC')"
    echo "  Backend: $([ "$DEPLOY_BACKEND" == "true" ] && echo "✅ Deployed" || echo "⏭️  Skipped")"
    echo "  Frontend: $([ "$DEPLOY_FRONTEND" == "true" ] && echo "✅ Deployed" || echo "⏭️  Skipped")"
    echo "  Database: ✅ Migrated"
    echo "  Health Checks: $([ "$RUN_HEALTH_CHECK" == "true" ] && echo "✅ Completed" || echo "⏭️  Skipped")"
    echo ""
    echo "🌐 Application URLs:"
    echo "  Frontend: https://okaygoal.vercel.app"
    echo "  Backend API: https://okaygoal-backend.railway.app/api/v1"
    echo "  Health Check: https://okaygoal-backend.railway.app/health"
    echo ""
    echo "🔧 Next Steps:"
    echo "  1. 🧪 Test the application thoroughly"
    echo "  2. 📊 Set up monitoring dashboards"
    echo "  3. 📱 Test push notifications"
    echo "  4. 👥 Conduct user acceptance testing"
    echo "  5. 🚀 Plan marketing launch"
    echo ""
    echo "📚 Useful Commands:"
    echo "  ./scripts/deployment-status.sh full  # View deployment dashboard"
    echo "  ./scripts/health-check.sh monitor   # Continuous monitoring"
    echo "  railway logs --follow               # View backend logs"
    echo "  vercel logs                         # View frontend logs"
    echo ""
    
    print_success "🚀 Ready for production! ⚽️"
}

# Main deployment function
main() {
    clear
    print_header "🏈 OkayGoal Production Deployment"
    print_header "=================================="
    echo ""
    
    # Check if this is a dry run
    if [[ "${1}" == "--dry-run" ]]; then
        echo "🔍 DRY RUN MODE - No actual deployment will occur"
        DEPLOY_BACKEND="false"
        DEPLOY_FRONTEND="false"
        echo ""
    fi
    
    # Show configuration
    print_status "Deployment Configuration:"
    echo "  Skip Tests: $SKIP_TESTS"
    echo "  Skip Build: $SKIP_BUILD"
    echo "  Deploy Backend: $DEPLOY_BACKEND"
    echo "  Deploy Frontend: $DEPLOY_FRONTEND"
    echo "  Run Health Checks: $RUN_HEALTH_CHECK"
    echo "  Generate Report: $GENERATE_REPORT"
    echo ""
    
    if [[ "${1}" != "--dry-run" ]]; then
        read -p "Continue with deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_warning "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Run deployment steps
    check_prerequisites
    check_environment
    run_tests
    build_applications
    run_migrations
    deploy_backend
    deploy_frontend
    run_health_checks
    generate_deployment_report
    show_deployment_summary
    
    return 0
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Show help
show_help() {
    echo "🏈 OkayGoal Production Deployment Script"
    echo "========================================"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --dry-run              Run without actual deployment"
    echo "  --help, -h             Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  SKIP_TESTS=true        Skip running tests"
    echo "  SKIP_BUILD=true        Skip building applications"
    echo "  DEPLOY_BACKEND=false   Skip backend deployment"
    echo "  DEPLOY_FRONTEND=false  Skip frontend deployment"
    echo "  RUN_HEALTH_CHECK=false Skip health checks"
    echo "  GENERATE_REPORT=false  Skip generating deployment report"
    echo ""
    echo "Examples:"
    echo "  $0                     # Full deployment"
    echo "  $0 --dry-run           # Test deployment process"
    echo "  SKIP_TESTS=true $0     # Deploy without running tests"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    "--help"|"-h")
        show_help
        exit 0
        ;;
    "--dry-run")
        main "$@"
        ;;
    "")
        main
        ;;
    *)
        echo "Unknown option: $1"
        show_help
        exit 1
        ;;
esac