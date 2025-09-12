# API-Football.com Integration Setup

This document describes how to set up the API-Football.com integration for the OkayGoal application.

## Overview

API-Football.com provides comprehensive football data including:
- Live scores and match events
- League standings and fixtures
- Team and player information
- Historical match data
- Competition details

## Setup Instructions

### 1. Create RapidAPI Account

1. Go to [RapidAPI.com](https://rapidapi.com/)
2. Sign up for a free account
3. Navigate to the [API-Football page](https://rapidapi.com/api-sports/api/api-football)
4. Subscribe to the API (free tier available)

### 2. Get Your API Key

1. After subscribing, go to your dashboard
2. Find API-Football in your subscribed APIs
3. Copy your RapidAPI key (X-RapidAPI-Key header value)
4. Save this key - you'll need it for deployment

### 3. Configure Environment Variables

Add the following environment variables to your production environment:

```bash
# API-Football Configuration
API_FOOTBALL_KEY=your-rapidapi-key-here
API_FOOTBALL_HOST=v3.football.api-sports.io
API_FOOTBALL_RATE_LIMIT=100
API_FOOTBALL_BASE_URL=https://v3.football.api-sports.io
```

### 4. Rate Limits

The free tier includes:
- **100 requests per day**
- Rate limit: 10 requests per minute
- For production, consider upgrading to a paid plan

### 5. Available Endpoints

The application uses these API endpoints:

#### Competitions
- `GET /leagues` - Get all competitions/leagues
- `GET /leagues/seasons` - Get available seasons
- `GET /standings` - Get league standings

#### Teams
- `GET /teams` - Get teams by league/season
- `GET /teams/statistics` - Get team statistics

#### Players
- `GET /players` - Get players by team/season
- `GET /players/topscorers` - Get top scorers
- `GET /players/topassists` - Get top assists

#### Matches
- `GET /fixtures` - Get fixtures by various filters
- `GET /fixtures/events` - Get match events
- `GET /fixtures/lineups` - Get match lineups
- `GET /fixtures/statistics` - Get match statistics

#### Live Scores
- `GET /fixtures?live=all` - Get all live matches
- `GET /fixtures?date={date}` - Get matches by date

### 6. Data Synchronization Strategy

The application implements a multi-layered data strategy:

#### Initial Data Load
```bash
# Run these scripts to populate initial data
npm run data:sync-competitions
npm run data:sync-teams
npm run data:sync-players
```

#### Real-time Updates
- Live matches: Every 30 seconds
- Match events: Every 15 seconds for live matches
- Standings: Every 6 hours
- Team stats: Daily

#### Caching Strategy
- **Competitions**: 24 hours
- **Teams**: 12 hours  
- **Players**: 6 hours
- **Fixtures**: 1 hour
- **Live matches**: 30 seconds
- **Standings**: 6 hours

### 7. Error Handling

The application handles various API errors:
- Rate limit exceeded (429)
- API unavailable (503)
- Invalid API key (401)
- Data not found (404)

When API is unavailable, the app falls back to cached data.

### 8. Testing the Integration

Use the following commands to test the API integration:

```bash
# Test API connection
curl -X GET \
  'https://v3.football.api-sports.io/status' \
  -H 'X-RapidAPI-Key: YOUR_API_KEY' \
  -H 'X-RapidAPI-Host: v3.football.api-sports.io'

# Test getting competitions
curl -X GET \
  'https://v3.football.api-sports.io/leagues' \
  -H 'X-RapidAPI-Key: YOUR_API_KEY' \
  -H 'X-RapidAPI-Host: v3.football.api-sports.io'
```

### 9. Production Deployment

For Railway deployment:

```bash
# Set the API key in Railway
railway variables set API_FOOTBALL_KEY=your-key-here

# Deploy with API integration
railway up
```

For Vercel (frontend environment variables):

```bash
# Set frontend API URL
vercel env add VITE_API_URL production
# Value: https://your-backend.railway.app/api/v1

vercel env add VITE_WS_URL production  
# Value: wss://your-backend.railway.app/ws
```

### 10. Monitoring and Analytics

Monitor your API usage:
- Check RapidAPI dashboard for usage stats
- Monitor response times in application logs
- Set up alerts for rate limit warnings

### 11. Backup Data Sources

In case API-Football is unavailable:
- ESPN API (limited)
- The Sports DB (free but limited)
- Football-Data.org (free tier available)

### 12. Cost Optimization

To minimize API costs:
- Cache frequently accessed data
- Use webhooks when available
- Batch requests when possible
- Only fetch data for followed teams/competitions
- Use database for historical data

### 13. Development vs Production

#### Development
- Use smaller dataset (specific leagues only)
- Longer cache times to reduce API calls
- Mock data for testing

#### Production
- Full dataset synchronization
- Real-time updates for live matches
- Comprehensive error handling

## Sample API Responses

### Competitions Response
```json
{
  "get": "leagues",
  "results": 1,
  "response": [
    {
      "league": {
        "id": 39,
        "name": "Premier League",
        "country": "England",
        "logo": "https://media.api-sports.io/football/leagues/39.png",
        "flag": "https://media.api-sports.io/flags/gb.svg",
        "season": 2023
      }
    }
  ]
}
```

### Live Matches Response
```json
{
  "get": "fixtures",
  "results": 1,
  "response": [
    {
      "fixture": {
        "id": 868127,
        "date": "2024-01-20T15:00:00+00:00",
        "status": {
          "long": "Match Finished",
          "short": "FT",
          "elapsed": 90
        }
      },
      "league": {
        "id": 39,
        "name": "Premier League"
      },
      "teams": {
        "home": {
          "id": 50,
          "name": "Manchester City",
          "logo": "https://media.api-sports.io/football/teams/50.png"
        },
        "away": {
          "id": 42,
          "name": "Arsenal",
          "logo": "https://media.api-sports.io/football/teams/42.png"
        }
      },
      "goals": {
        "home": 2,
        "away": 1
      }
    }
  ]
}
```

## Support

For API-Football support:
- [API Documentation](https://www.api-football.com/documentation-v3)
- [RapidAPI Dashboard](https://rapidapi.com/developer/dashboard)
- [Community Forum](https://rapidapi.com/api-sports/api/api-football/discussions)