#!/bin/bash

set -e

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
    echo -e "${CYAN}=== $1 ===${NC}"
}

# Configuration
BACKEND_URL="${BACKEND_URL:-https://okaygoal-backend.railway.app}"
FRONTEND_URL="${FRONTEND_URL:-https://okaygoal.vercel.app}"

# Check Railway deployment status
check_railway_status() {
    print_section "RAILWAY DEPLOYMENT STATUS"
    
    if command -v railway &> /dev/null; then
        if railway whoami &> /dev/null; then
            print_success "Railway CLI authenticated"
            
            # Get deployment info
            print_status "Fetching Railway deployment information..."
            
            # Note: These commands may need adjustment based on Railway CLI version
            echo "Project information:"
            railway status 2>/dev/null || echo "  Unable to fetch project status"
            
            echo ""
            echo "Recent deployments:"
            railway logs --lines 5 2>/dev/null || echo "  Unable to fetch deployment logs"
            
        else
            print_warning "Railway CLI not authenticated. Run: railway login"
        fi
    else
        print_warning "Railway CLI not found. Install with: npm install -g @railway/cli"
    fi
}

# Check Vercel deployment status
check_vercel_status() {
    print_section "VERCEL DEPLOYMENT STATUS"
    
    if command -v vercel &> /dev/null; then
        if vercel whoami &> /dev/null; then
            print_success "Vercel CLI authenticated"
            
            print_status "Fetching Vercel deployment information..."
            
            # Get deployment list
            echo "Recent deployments:"
            vercel ls --limit 5 2>/dev/null || echo "  Unable to fetch deployment list"
            
        else
            print_warning "Vercel CLI not authenticated. Run: vercel login"
        fi
    else
        print_warning "Vercel CLI not found. Install with: npm install -g vercel"
    fi
}

# Check GitHub Actions status
check_github_actions() {
    print_section "GITHUB ACTIONS STATUS"
    
    if command -v gh &> /dev/null; then
        if gh auth status &> /dev/null; then
            print_success "GitHub CLI authenticated"
            
            print_status "Fetching GitHub Actions workflow status..."
            
            # Get workflow runs
            echo "Recent workflow runs:"
            gh run list --limit 5 2>/dev/null || echo "  Unable to fetch workflow runs (repository may not exist)"
            
        else
            print_warning "GitHub CLI not authenticated. Run: gh auth login"
        fi
    else
        print_warning "GitHub CLI not found. Install from: https://cli.github.com/"
    fi
}

# Check application health
check_application_health() {
    print_section "APPLICATION HEALTH"
    
    # Backend health
    print_status "Checking backend health..."
    local backend_response=$(curl -s -w "%{http_code}" -o /tmp/backend_health.json \
                            --max-time 10 "$BACKEND_URL/health" 2>/dev/null || echo "000")
    
    if [[ "$backend_response" == "200" ]]; then
        print_success "Backend is healthy"
        local status=$(jq -r '.status' /tmp/backend_health.json 2>/dev/null || echo "unknown")
        local uptime=$(jq -r '.uptime' /tmp/backend_health.json 2>/dev/null || echo "unknown")
        local version=$(jq -r '.version' /tmp/backend_health.json 2>/dev/null || echo "unknown")
        echo "  Status: $status"
        echo "  Uptime: $uptime seconds"
        echo "  Version: $version"
        rm -f /tmp/backend_health.json
    else
        print_error "Backend health check failed (HTTP $backend_response)"
    fi
    
    echo ""
    
    # Frontend availability
    print_status "Checking frontend availability..."
    local frontend_response=$(curl -s -w "%{http_code}" -o /dev/null \
                             --max-time 10 "$FRONTEND_URL" 2>/dev/null || echo "000")
    
    if [[ "$frontend_response" == "200" ]]; then
        print_success "Frontend is available"
    else
        print_error "Frontend availability check failed (HTTP $frontend_response)"
    fi
}

# Check environment configuration
check_environment_config() {
    print_section "ENVIRONMENT CONFIGURATION"
    
    echo "Environment variables status:"
    
    # Check critical environment variables
    local env_vars=(
        "NODE_ENV"
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "API_FOOTBALL_KEY"
        "FRONTEND_URL"
    )
    
    for var in "${env_vars[@]}"; do
        if [[ -n "${!var}" ]]; then
            echo "  ✓ $var is set"
        else
            echo "  ✗ $var is not set"
        fi
    done
    
    echo ""
    echo "Current environment: ${NODE_ENV:-development}"
    echo "Database URL: ${DATABASE_URL:+[SET]}${DATABASE_URL:-[NOT SET]}"
    echo "Redis URL: ${REDIS_URL:+[SET]}${REDIS_URL:-[NOT SET]}"
    echo "API Key: ${API_FOOTBALL_KEY:+[SET]}${API_FOOTBALL_KEY:-[NOT SET]}"
}

# Check database status
check_database_status() {
    print_section "DATABASE STATUS"
    
    if [[ -n "$DATABASE_URL" ]]; then
        if command -v psql &> /dev/null; then
            print_status "Testing database connection..."
            if psql "$DATABASE_URL" -c "SELECT version();" &> /tmp/db_version.txt; then
                print_success "Database connection successful"
                local db_version=$(cat /tmp/db_version.txt | head -n 3 | tail -n 1 | sed 's/^[ \t]*//')
                echo "  Version: $db_version"
                rm -f /tmp/db_version.txt
                
                # Check migrations
                print_status "Checking migration status..."
                local migration_count=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM schema_migrations;" 2>/dev/null | sed 's/^[ \t]*//' || echo "0")
                echo "  Applied migrations: $migration_count"
                
            else
                print_error "Database connection failed"
                rm -f /tmp/db_version.txt
            fi
        else
            print_warning "psql not available - checking via API"
            # Database status will be shown in application health check
        fi
    else
        print_warning "DATABASE_URL not configured"
    fi
}

# Check Redis status
check_redis_status() {
    print_section "REDIS STATUS"
    
    if [[ -n "$REDIS_URL" ]]; then
        if command -v redis-cli &> /dev/null; then
            print_status "Testing Redis connection..."
            if redis-cli -u "$REDIS_URL" ping | grep -q "PONG"; then
                print_success "Redis connection successful"
                local redis_info=$(redis-cli -u "$REDIS_URL" info server | grep "redis_version" | cut -d: -f2 | tr -d '\r')
                echo "  Version: $redis_info"
            else
                print_error "Redis connection failed"
            fi
        else
            print_warning "redis-cli not available - checking via API"
        fi
    else
        print_warning "REDIS_URL not configured"
    fi
}

# Check API Football status
check_api_football_status() {
    print_section "API FOOTBALL STATUS"
    
    if [[ -n "$API_FOOTBALL_KEY" ]]; then
        print_status "Testing API-Football connection..."
        local api_response=$(curl -s -w "%{http_code}" -o /tmp/api_status.json \
            -X GET "https://v3.football.api-sports.io/status" \
            -H "X-RapidAPI-Key: $API_FOOTBALL_KEY" \
            -H "X-RapidAPI-Host: v3.football.api-sports.io" 2>/dev/null || echo "000")
        
        if [[ "$api_response" == "200" ]]; then
            print_success "API-Football connection successful"
            local requests_used=$(jq -r '.response.requests.used' /tmp/api_status.json 2>/dev/null || echo "unknown")
            local requests_limit=$(jq -r '.response.requests.limit_day' /tmp/api_status.json 2>/dev/null || echo "unknown")
            echo "  Usage today: $requests_used / $requests_limit requests"
            rm -f /tmp/api_status.json
        else
            print_error "API-Football connection failed (HTTP $api_response)"
            rm -f /tmp/api_status.json
        fi
    else
        print_warning "API_FOOTBALL_KEY not configured"
    fi
}

# Check SSL certificates
check_ssl_status() {
    print_section "SSL CERTIFICATE STATUS"
    
    if command -v openssl &> /dev/null; then
        local domains=(
            "${BACKEND_URL#https://}"
            "${FRONTEND_URL#https://}"
        )
        
        for domain in "${domains[@]}"; do
            print_status "Checking SSL certificate for $domain..."
            local cert_info=$(echo | openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | openssl x509 -noout -dates -subject 2>/dev/null)
            
            if [[ -n "$cert_info" ]]; then
                local not_after=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2-)
                local subject=$(echo "$cert_info" | grep "subject" | cut -d= -f2-)
                echo "  ✓ $domain"
                echo "    Subject: $subject"
                echo "    Expires: $not_after"
            else
                print_error "SSL certificate check failed for $domain"
            fi
        done
    else
        print_warning "openssl not available - skipping SSL checks"
    fi
}

# Performance summary
show_performance_summary() {
    print_section "PERFORMANCE SUMMARY"
    
    print_status "Testing response times..."
    
    # Backend performance
    local start_time=$(date +%s%3N)
    curl -s -o /dev/null "$BACKEND_URL/health" 2>/dev/null || true
    local end_time=$(date +%s%3N)
    local backend_time=$((end_time - start_time))
    
    # Frontend performance  
    start_time=$(date +%s%3N)
    curl -s -o /dev/null "$FRONTEND_URL" 2>/dev/null || true
    end_time=$(date +%s%3N)
    local frontend_time=$((end_time - start_time))
    
    echo "Response Times:"
    echo "  Backend: ${backend_time}ms"
    echo "  Frontend: ${frontend_time}ms"
    
    # Performance ratings
    if [[ $backend_time -lt 500 ]]; then
        echo "  Backend Performance: ✅ Excellent"
    elif [[ $backend_time -lt 1000 ]]; then
        echo "  Backend Performance: ✅ Good"
    elif [[ $backend_time -lt 2000 ]]; then
        echo "  Backend Performance: ⚠️  Average"
    else
        echo "  Backend Performance: ❌ Poor"
    fi
    
    if [[ $frontend_time -lt 1000 ]]; then
        echo "  Frontend Performance: ✅ Excellent"
    elif [[ $frontend_time -lt 2000 ]]; then
        echo "  Frontend Performance: ✅ Good"
    elif [[ $frontend_time -lt 3000 ]]; then
        echo "  Frontend Performance: ⚠️  Average"
    else
        echo "  Frontend Performance: ❌ Poor"
    fi
}

# Quick deployment summary
show_quick_status() {
    echo "🚀 OkayGoal Deployment Quick Status"
    echo "=================================="
    echo "$(date '+%Y-%m-%d %H:%M:%S UTC')"
    echo ""
    
    # Backend status
    local backend_status="❌ DOWN"
    if curl -s --max-time 5 "$BACKEND_URL/health" > /dev/null 2>&1; then
        backend_status="✅ UP"
    fi
    
    # Frontend status
    local frontend_status="❌ DOWN"
    if curl -s --max-time 5 "$FRONTEND_URL" > /dev/null 2>&1; then
        frontend_status="✅ UP"
    fi
    
    echo "Backend:  $backend_status ($BACKEND_URL)"
    echo "Frontend: $frontend_status ($FRONTEND_URL)"
    echo ""
    
    if [[ "$backend_status" == "✅ UP" && "$frontend_status" == "✅ UP" ]]; then
        print_success "🎉 Application is fully operational!"
    else
        print_error "⚠️  Some services are experiencing issues"
    fi
}

# Full deployment dashboard
show_full_dashboard() {
    clear
    echo "📊 OkayGoal Deployment Dashboard"
    echo "================================"
    echo "Generated: $(date '+%Y-%m-%d %H:%M:%S UTC')"
    echo "Backend: $BACKEND_URL"
    echo "Frontend: $FRONTEND_URL"
    echo ""
    
    check_railway_status
    echo ""
    
    check_vercel_status
    echo ""
    
    check_github_actions
    echo ""
    
    check_application_health
    echo ""
    
    check_environment_config
    echo ""
    
    check_database_status
    echo ""
    
    check_redis_status
    echo ""
    
    check_api_football_status
    echo ""
    
    check_ssl_status
    echo ""
    
    show_performance_summary
    echo ""
    
    print_header "🎯 NEXT STEPS"
    echo "1. Monitor application logs for any issues"
    echo "2. Set up monitoring alerts and dashboards"
    echo "3. Configure custom domain names if needed"
    echo "4. Run user acceptance testing"
    echo "5. Plan marketing and user acquisition"
}

# Main function
main() {
    local command="${1:-quick}"
    
    case "$command" in
        "quick"|"q")
            show_quick_status
            ;;
        "full"|"f"|"dashboard")
            show_full_dashboard
            ;;
        "health")
            check_application_health
            ;;
        "env")
            check_environment_config
            ;;
        "perf"|"performance")
            show_performance_summary
            ;;
        *)
            echo "Usage: $0 [quick|full|health|env|perf]"
            echo ""
            echo "Commands:"
            echo "  quick    - Quick status check (default)"
            echo "  full     - Full deployment dashboard"
            echo "  health   - Application health only"
            echo "  env      - Environment configuration only"
            echo "  perf     - Performance summary only"
            echo ""
            echo "Environment variables:"
            echo "  BACKEND_URL  - Backend URL"
            echo "  FRONTEND_URL - Frontend URL"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"