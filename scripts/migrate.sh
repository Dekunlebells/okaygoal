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

# Check if DATABASE_URL is set
check_database_url() {
    if [[ -z "$DATABASE_URL" ]]; then
        print_error "DATABASE_URL environment variable is not set"
        echo "Please set DATABASE_URL to your PostgreSQL connection string"
        echo "Example: postgresql://username:password@hostname:port/database"
        exit 1
    fi
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."
    
    if command -v psql &> /dev/null; then
        if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
            print_success "Database connection successful"
        else
            print_error "Cannot connect to database"
            exit 1
        fi
    else
        print_warning "psql not found. Skipping connection test."
    fi
}

# Get applied migrations
get_applied_migrations() {
    psql "$DATABASE_URL" -t -c "SELECT version FROM schema_migrations ORDER BY applied_at;" 2>/dev/null | sed 's/^[ \t]*//' || echo ""
}

# Check if migration is applied
is_migration_applied() {
    local migration_version="$1"
    local applied_migrations="$2"
    echo "$applied_migrations" | grep -q "^$migration_version$"
}

# Apply a single migration
apply_migration() {
    local migration_file="$1"
    local migration_version=$(basename "$migration_file" .sql)
    
    print_status "Applying migration: $migration_version"
    
    if psql "$DATABASE_URL" -f "$migration_file"; then
        print_success "Migration $migration_version applied successfully"
    else
        print_error "Failed to apply migration: $migration_version"
        exit 1
    fi
}

# Run all pending migrations
run_migrations() {
    print_status "Running database migrations..."
    
    local migrations_dir="database/migrations"
    
    if [[ ! -d "$migrations_dir" ]]; then
        print_error "Migrations directory not found: $migrations_dir"
        exit 1
    fi
    
    # Create schema_migrations table first
    print_status "Creating schema_migrations table..."
    psql "$DATABASE_URL" -f "$migrations_dir/000_schema_migrations.sql"
    
    # Get list of applied migrations
    local applied_migrations=$(get_applied_migrations)
    
    # Find and apply pending migrations
    local pending_count=0
    
    for migration_file in "$migrations_dir"/*.sql; do
        if [[ -f "$migration_file" ]]; then
            local migration_version=$(basename "$migration_file" .sql)
            
            # Skip the schema_migrations file as it's already applied
            if [[ "$migration_version" == "000_schema_migrations" ]]; then
                continue
            fi
            
            if ! is_migration_applied "$migration_version" "$applied_migrations"; then
                apply_migration "$migration_file"
                ((pending_count++))
            else
                print_status "Migration $migration_version already applied (skipping)"
            fi
        fi
    done
    
    if [[ $pending_count -eq 0 ]]; then
        print_success "No pending migrations found. Database is up to date."
    else
        print_success "Applied $pending_count migrations"
    fi
}

# Show migration status
show_status() {
    print_status "Migration Status"
    echo "================"
    
    local applied_migrations=$(get_applied_migrations)
    
    if [[ -z "$applied_migrations" ]]; then
        echo "No migrations have been applied yet."
        return
    fi
    
    echo "Applied migrations:"
    echo "$applied_migrations" | while read -r migration; do
        if [[ -n "$migration" ]]; then
            echo "  ✓ $migration"
        fi
    done
    
    # Show pending migrations
    local migrations_dir="database/migrations"
    local pending_migrations=()
    
    for migration_file in "$migrations_dir"/*.sql; do
        if [[ -f "$migration_file" ]]; then
            local migration_version=$(basename "$migration_file" .sql)
            
            if [[ "$migration_version" == "000_schema_migrations" ]]; then
                continue
            fi
            
            if ! is_migration_applied "$migration_version" "$applied_migrations"; then
                pending_migrations+=("$migration_version")
            fi
        fi
    done
    
    if [[ ${#pending_migrations[@]} -gt 0 ]]; then
        echo ""
        echo "Pending migrations:"
        for migration in "${pending_migrations[@]}"; do
            echo "  ○ $migration"
        done
    else
        echo ""
        echo "All migrations are up to date."
    fi
}

# Reset database (DANGEROUS - only for development)
reset_database() {
    if [[ "${NODE_ENV:-development}" == "production" ]]; then
        print_error "Database reset is not allowed in production environment"
        exit 1
    fi
    
    read -p "Are you sure you want to reset the database? This will delete ALL data. (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
        print_warning "Database reset cancelled"
        exit 0
    fi
    
    print_warning "Resetting database..."
    
    # Drop all tables (this is a simplified approach)
    psql "$DATABASE_URL" -c "
        DO \$\$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END \$\$;
    "
    
    print_success "Database reset completed"
}

# Create a new migration file
create_migration() {
    local migration_name="$1"
    
    if [[ -z "$migration_name" ]]; then
        print_error "Migration name is required"
        echo "Usage: $0 create <migration_name>"
        exit 1
    fi
    
    local timestamp=$(date +%s)
    local migration_file="database/migrations/${timestamp}_${migration_name}.sql"
    
    mkdir -p database/migrations
    
    cat > "$migration_file" << EOF
-- Migration: $migration_name
-- Created: $(date +%Y-%m-%d)

-- Add your migration SQL here

-- Migration completed
INSERT INTO schema_migrations (version, applied_at) VALUES ('${timestamp}_${migration_name}', NOW())
ON CONFLICT (version) DO NOTHING;
EOF

    print_success "Created migration: $migration_file"
}

# Seed database with sample data
seed_database() {
    local seed_file="database/seeds/sample_data.sql"
    
    if [[ -f "$seed_file" ]]; then
        print_status "Seeding database with sample data..."
        psql "$DATABASE_URL" -f "$seed_file"
        print_success "Database seeded successfully"
    else
        print_warning "Seed file not found: $seed_file"
    fi
}

# Main function
main() {
    local command="${1:-migrate}"
    
    echo "🗃️  OkayGoal Database Migration Tool"
    echo "===================================="
    
    check_database_url
    test_connection
    
    case "$command" in
        "migrate"|"up")
            run_migrations
            ;;
        "status")
            show_status
            ;;
        "reset")
            reset_database
            ;;
        "create")
            create_migration "$2"
            ;;
        "seed")
            seed_database
            ;;
        *)
            echo "Usage: $0 [migrate|status|reset|create|seed]"
            echo ""
            echo "Commands:"
            echo "  migrate  - Run all pending migrations (default)"
            echo "  status   - Show migration status"
            echo "  reset    - Reset database (development only)"
            echo "  create   - Create a new migration file"
            echo "  seed     - Seed database with sample data"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'print_error "Migration interrupted"; exit 1' INT TERM

# Run main function
main "$@"