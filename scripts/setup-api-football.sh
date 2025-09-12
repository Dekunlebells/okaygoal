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

# Check if API key is provided
check_api_key() {
    if [[ -z "$API_FOOTBALL_KEY" ]]; then
        print_error "API_FOOTBALL_KEY environment variable is not set"
        echo ""
        echo "Please follow these steps:"
        echo "1. Go to https://rapidapi.com/api-sports/api/api-football"
        echo "2. Subscribe to the API (free tier available)"
        echo "3. Get your RapidAPI key"
        echo "4. Set the environment variable: export API_FOOTBALL_KEY=your-key-here"
        echo ""
        exit 1
    fi
}

# Test API connection
test_api_connection() {
    print_status "Testing API-Football connection..."
    
    local response
    response=$(curl -s -w "%{http_code}" -o /tmp/api_test.json \
        -X GET "https://v3.football.api-sports.io/status" \
        -H "X-RapidAPI-Key: $API_FOOTBALL_KEY" \
        -H "X-RapidAPI-Host: v3.football.api-sports.io")
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        print_success "API connection successful"
        
        # Show API status
        local requests_used=$(jq -r '.response.requests.used' /tmp/api_test.json 2>/dev/null || echo "unknown")
        local requests_limit=$(jq -r '.response.requests.limit_day' /tmp/api_test.json 2>/dev/null || echo "unknown")
        
        echo "API Usage: $requests_used / $requests_limit requests today"
        
        rm -f /tmp/api_test.json
    else
        print_error "API connection failed (HTTP $http_code)"
        if [[ -f "/tmp/api_test.json" ]]; then
            echo "Response:"
            cat /tmp/api_test.json
            rm -f /tmp/api_test.json
        fi
        exit 1
    fi
}

# Sync competitions data
sync_competitions() {
    print_status "Syncing competitions data..."
    
    local response
    response=$(curl -s -w "%{http_code}" -o /tmp/competitions.json \
        -X GET "https://v3.football.api-sports.io/leagues" \
        -H "X-RapidAPI-Key: $API_FOOTBALL_KEY" \
        -H "X-RapidAPI-Host: v3.football.api-sports.io")
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        local results=$(jq -r '.results' /tmp/competitions.json 2>/dev/null || echo "0")
        print_success "Fetched $results competitions"
        
        # Save to database (you would implement this in your Node.js application)
        if [[ -n "$DATABASE_URL" ]] && command -v node &> /dev/null; then
            print_status "Saving competitions to database..."
            node -e "
                const fs = require('fs');
                const data = JSON.parse(fs.readFileSync('/tmp/competitions.json', 'utf8'));
                // Here you would implement the database save logic
                console.log('Competitions data ready for import');
            "
        fi
        
        rm -f /tmp/competitions.json
    else
        print_error "Failed to fetch competitions (HTTP $http_code)"
        exit 1
    fi
}

# Sync major teams data
sync_major_teams() {
    print_status "Syncing major league teams..."
    
    # Major league IDs
    local leagues=(39 140 78 135 61) # Premier League, La Liga, Bundesliga, Serie A, Ligue 1
    local current_season=2023
    
    for league_id in "${leagues[@]}"; do
        print_status "Fetching teams for league $league_id..."
        
        local response
        response=$(curl -s -w "%{http_code}" -o "/tmp/teams_$league_id.json" \
            -X GET "https://v3.football.api-sports.io/teams?league=$league_id&season=$current_season" \
            -H "X-RapidAPI-Key: $API_FOOTBALL_KEY" \
            -H "X-RapidAPI-Host: v3.football.api-sports.io")
        
        local http_code="${response: -3}"
        
        if [[ "$http_code" == "200" ]]; then
            local results=$(jq -r '.results' "/tmp/teams_$league_id.json" 2>/dev/null || echo "0")
            print_success "Fetched $results teams for league $league_id"
        else
            print_warning "Failed to fetch teams for league $league_id (HTTP $http_code)"
        fi
        
        # Rate limiting - wait between requests
        sleep 1
    done
    
    # Clean up
    rm -f /tmp/teams_*.json
}

# Get today's fixtures
get_todays_fixtures() {
    print_status "Fetching today's fixtures..."
    
    local today=$(date +%Y-%m-%d)
    local response
    response=$(curl -s -w "%{http_code}" -o /tmp/fixtures_today.json \
        -X GET "https://v3.football.api-sports.io/fixtures?date=$today" \
        -H "X-RapidAPI-Key: $API_FOOTBALL_KEY" \
        -H "X-RapidAPI-Host: v3.football.api-sports.io")
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        local results=$(jq -r '.results' /tmp/fixtures_today.json 2>/dev/null || echo "0")
        print_success "Found $results fixtures for today ($today)"
        
        if [[ "$results" != "0" ]]; then
            echo "Today's matches:"
            jq -r '.response[] | "\(.teams.home.name) vs \(.teams.away.name) - \(.fixture.date)"' /tmp/fixtures_today.json 2>/dev/null | head -5
            if [[ "$results" -gt 5 ]]; then
                echo "... and $(($results - 5)) more matches"
            fi
        else
            echo "No matches scheduled for today"
        fi
        
        rm -f /tmp/fixtures_today.json
    else
        print_error "Failed to fetch today's fixtures (HTTP $http_code)"
        exit 1
    fi
}

# Get live matches
get_live_matches() {
    print_status "Checking for live matches..."
    
    local response
    response=$(curl -s -w "%{http_code}" -o /tmp/live_matches.json \
        -X GET "https://v3.football.api-sports.io/fixtures?live=all" \
        -H "X-RapidAPI-Key: $API_FOOTBALL_KEY" \
        -H "X-RapidAPI-Host: v3.football.api-sports.io")
    
    local http_code="${response: -3}"
    
    if [[ "$http_code" == "200" ]]; then
        local results=$(jq -r '.results' /tmp/live_matches.json 2>/dev/null || echo "0")
        
        if [[ "$results" != "0" ]]; then
            print_success "Found $results live matches"
            echo "Live matches:"
            jq -r '.response[] | "\(.teams.home.name) \(.goals.home) - \(.goals.away) \(.teams.away.name) (\(.fixture.status.elapsed)\")"' /tmp/live_matches.json 2>/dev/null | head -3
        else
            print_success "No live matches at the moment"
        fi
        
        rm -f /tmp/live_matches.json
    else
        print_error "Failed to fetch live matches (HTTP $http_code)"
        exit 1
    fi
}

# Setup data sync for production
setup_data_sync() {
    print_status "Setting up data synchronization..."
    
    # Create data sync directory
    mkdir -p data/sync
    
    # Create sync configuration
    cat > data/sync/config.json << EOF
{
  "api": {
    "baseUrl": "https://v3.football.api-sports.io",
    "host": "v3.football.api-sports.io",
    "rateLimit": {
      "requests": 100,
      "period": "day",
      "delay": 1000
    }
  },
  "sync": {
    "competitions": {
      "interval": "24h",
      "endpoint": "/leagues"
    },
    "teams": {
      "interval": "12h",
      "endpoint": "/teams"
    },
    "fixtures": {
      "interval": "1h",
      "endpoint": "/fixtures"
    },
    "standings": {
      "interval": "6h",
      "endpoint": "/standings"
    },
    "live": {
      "interval": "30s",
      "endpoint": "/fixtures?live=all"
    }
  },
  "majorLeagues": [39, 140, 78, 135, 61, 2, 3],
  "currentSeason": 2023
}
EOF

    print_success "Data sync configuration created"
}

# Create API service test
create_api_test() {
    print_status "Creating API service tests..."
    
    mkdir -p tests/api
    
    cat > tests/api/api-football.test.js << EOF
const axios = require('axios');

describe('API-Football Integration', () => {
  const API_KEY = process.env.API_FOOTBALL_KEY;
  const BASE_URL = 'https://v3.football.api-sports.io';
  
  const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': 'v3.football.api-sports.io',
    },
  });

  test('should connect to API-Football', async () => {
    const response = await apiClient.get('/status');
    expect(response.status).toBe(200);
    expect(response.data.response.requests).toBeDefined();
  });

  test('should fetch competitions', async () => {
    const response = await apiClient.get('/leagues');
    expect(response.status).toBe(200);
    expect(response.data.results).toBeGreaterThan(0);
  });

  test('should fetch Premier League standings', async () => {
    const response = await apiClient.get('/standings?league=39&season=2023');
    expect(response.status).toBe(200);
    expect(response.data.results).toBeGreaterThan(0);
  });

  test('should fetch today fixtures', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await apiClient.get(\`/fixtures?date=\${today}\`);
    expect(response.status).toBe(200);
    expect(response.data.results).toBeGreaterThanOrEqual(0);
  });
});
EOF

    print_success "API tests created"
}

# Show usage information
show_usage() {
    echo "📊 API-Football Integration Setup"
    echo "================================="
    echo ""
    echo "This script helps set up and test the API-Football.com integration."
    echo ""
    echo "Prerequisites:"
    echo "1. RapidAPI account with API-Football subscription"
    echo "2. API_FOOTBALL_KEY environment variable set"
    echo ""
    echo "Commands:"
    echo "  test        - Test API connection and show usage"
    echo "  sync        - Sync competitions and teams data"
    echo "  fixtures    - Get today's fixtures"
    echo "  live        - Get live matches"
    echo "  setup       - Set up data sync configuration"
    echo "  createtest  - Create API test files"
    echo "  all         - Run all setup tasks"
    echo ""
    echo "Example:"
    echo "  export API_FOOTBALL_KEY=your-key-here"
    echo "  ./scripts/setup-api-football.sh all"
}

# Main function
main() {
    local command="${1:-help}"
    
    if [[ "$command" == "help" ]] || [[ "$command" == "--help" ]] || [[ "$command" == "-h" ]]; then
        show_usage
        exit 0
    fi
    
    check_api_key
    
    case "$command" in
        "test")
            test_api_connection
            ;;
        "sync")
            test_api_connection
            sync_competitions
            sync_major_teams
            ;;
        "fixtures")
            test_api_connection
            get_todays_fixtures
            ;;
        "live")
            test_api_connection
            get_live_matches
            ;;
        "setup")
            setup_data_sync
            ;;
        "createtest")
            create_api_test
            ;;
        "all")
            test_api_connection
            sync_competitions
            sync_major_teams
            get_todays_fixtures
            get_live_matches
            setup_data_sync
            create_api_test
            ;;
        *)
            print_error "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
    
    print_success "✅ API-Football setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Review the API documentation: docs/API_FOOTBALL_SETUP.md"
    echo "2. Set up your production environment variables"
    echo "3. Run the data sync in your application"
    echo "4. Monitor API usage on RapidAPI dashboard"
}

# Handle script interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"