# OkayGoal - Development Setup Guide

Complete guide to set up and run the OkayGoal application locally for development.

## 📋 Prerequisites

### Required Software
- **Node.js 20+** - [Download](https://nodejs.org/en/download/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Redis 7+** - [Download](https://redis.io/download/)
- **Git** - [Download](https://git-scm.com/downloads)

### API Keys Required
- **API-Football.com** API Key - [Get API Key](https://www.api-football.com/)
  - Sign up for the Ultra plan (75K requests/day)
  - Cost: ~$30/month for production use

## 🚀 Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd okaygoal
```

### 2. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Set Up Database

**Start PostgreSQL and Redis:**
```bash
# macOS with Homebrew
brew services start postgresql
brew services start redis

# Ubuntu/Debian
sudo systemctl start postgresql
sudo systemctl start redis

# Windows - Start services manually or use Docker
```

**Create Database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE okaygoal;
CREATE USER okaygoal_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE okaygoal TO okaygoal_user;
\q
```

### 4. Configure Environment Variables

**Backend (.env):**
```bash
cd backend
cp .env.example .env

# Edit .env file with your settings:
# - Database credentials
# - API-Football key
# - JWT secrets (generate strong random strings)
```

**Frontend (.env.local):**
```bash
cd frontend
echo "VITE_API_URL=http://localhost:3001/api/v1" > .env.local
echo "VITE_WS_URL=ws://localhost:3001/ws" >> .env.local
```

### 5. Initialize Database Schema
```bash
cd backend
npm run db:migrate
```

### 6. Start the Applications

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Access the Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/v1

## 🔧 Detailed Setup Instructions

### Database Setup

1. **Install PostgreSQL 15+**
```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql-15 postgresql-client-15
sudo systemctl start postgresql

# CentOS/RHEL/Fedora
sudo dnf install postgresql15-server postgresql15
sudo postgresql-setup --initdb
sudo systemctl start postgresql
```

2. **Install Redis 7+**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server

# CentOS/RHEL/Fedora
sudo dnf install redis
sudo systemctl start redis
```

3. **Create Database and User**
```sql
-- Connect as postgres user
psql -U postgres

-- Create database and user
CREATE DATABASE okaygoal;
CREATE USER okaygoal_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE okaygoal TO okaygoal_user;
ALTER USER okaygoal_user CREATEDB;

-- Connect to the database
\c okaygoal

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### API-Football Setup

1. **Register for API-Football.com**
   - Go to [API-Football.com](https://www.api-football.com/)
   - Create an account
   - Subscribe to the **Ultra plan** (75K requests/day)

2. **Get API Key**
   - Go to Dashboard → My Account → API Key
   - Copy your API key

3. **Add to Environment**
```bash
# In backend/.env
API_FOOTBALL_KEY=your_api_key_here
API_FOOTBALL_HOST=v3.football.api-sports.io
```

### Environment Configuration

**Backend Environment (.env):**
```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=okaygoal
DB_USER=okaygoal_user
DB_PASSWORD=your_secure_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration (Generate strong random strings!)
JWT_SECRET=your-256-bit-secret-key-change-this
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# API-Football Configuration
API_FOOTBALL_KEY=your-api-football-key
API_FOOTBALL_HOST=v3.football.api-sports.io

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS_FREE=1000
RATE_LIMIT_MAX_REQUESTS_PREMIUM=10000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Logging
LOG_LEVEL=debug
```

**Generate JWT Secrets:**
```bash
# Generate secure random strings for JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Development Workflow

1. **Start Services in Order:**
```bash
# Terminal 1: Database services
brew services start postgresql redis
# or
sudo systemctl start postgresql redis

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Frontend  
cd frontend
npm run dev
```

2. **Initialize Data (Optional)**
```bash
# Seed database with sample data
cd backend
npm run db:seed
```

3. **Access Applications:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **Health Check**: http://localhost:3001/health

## 🧪 Testing the Setup

### 1. Backend Health Check
```bash
curl http://localhost:3001/health
# Should return: {"success": true, "database": {...}, ...}
```

### 2. API Authentication Test
```bash
# Register a test user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","first_name":"Test"}'

# Should return: {"success": true, "data": {"user": {...}, "access_token": "..."}}
```

### 3. Live Matches Test
```bash
# Test live matches endpoint (requires auth token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/v1/matches/live
```

### 4. WebSocket Test
Open browser console on http://localhost:5173 and run:
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
```

## 🔍 Troubleshooting

### Common Issues

**1. Database Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Check if PostgreSQL is running: `brew services list | grep postgres`
- Start PostgreSQL: `brew services start postgresql`
- Check connection: `psql -U postgres -h localhost`

**2. Redis Connection Error** 
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution:**
- Check if Redis is running: `brew services list | grep redis`
- Start Redis: `brew services start redis`
- Test connection: `redis-cli ping`

**3. API-Football Rate Limit**
```
Error: API-Football rate limit exceeded
```
**Solution:**
- Check your usage at API-Football dashboard
- Upgrade to higher tier plan
- Implement caching to reduce API calls

**4. CORS Errors**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Check `ALLOWED_ORIGINS` in backend `.env`
- Add your frontend URL: `http://localhost:5173`
- Restart backend server

**5. JWT Token Issues**
```
Error: Invalid token
```
**Solution:**
- Check JWT secrets are properly set
- Clear localStorage: `localStorage.clear()`
- Re-login to get new tokens

### Debugging Tips

**Backend Logs:**
```bash
# Increase log level in .env
LOG_LEVEL=debug

# Check logs
tail -f logs/combined.log
```

**Database Debug:**
```bash
# Connect to database
psql -U okaygoal_user -d okaygoal -h localhost

# Check tables
\dt

# Check recent matches
SELECT * FROM matches ORDER BY created_at DESC LIMIT 5;
```

**WebSocket Debug:**
```javascript
// Browser console
localStorage.setItem('debug', 'websocket');
```

## 🚀 Production Deployment

### Docker Setup (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Manual Production Setup

1. **Environment Variables**
```env
NODE_ENV=production
DB_HOST=your-production-db-host
REDIS_HOST=your-production-redis-host
# ... update all production values
```

2. **Build Applications**
```bash
# Backend
cd backend
npm run build
npm start

# Frontend  
cd frontend
npm run build
# Deploy dist/ folder to CDN/static hosting
```

3. **Database Migration**
```bash
npm run db:migrate
```

## 📊 Monitoring

### Health Endpoints
- **Backend Health**: `GET /health`
- **API Usage**: `GET /api/v1/admin/api-usage`
- **WebSocket Stats**: `GET /api/v1/admin/websocket-stats`

### Log Files
- **Combined Logs**: `logs/combined.log`
- **Error Logs**: `logs/error.log`

## 🔧 Development Tools

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense  
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint

### Database Tools
- **pgAdmin 4** - GUI for PostgreSQL
- **Redis Desktop Manager** - GUI for Redis

### API Testing
- **Postman** - API testing collection
- **curl** - Command line testing
- **WebSocket King** - WebSocket testing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

Private - All rights reserved

---

## 🎯 Next Steps After Setup

1. **Explore the Application**
   - Register a new account
   - Browse live scores
   - Test real-time updates

2. **Customize Features**
   - Modify team badges
   - Add new competition types
   - Enhance match statistics

3. **Scale for Production**
   - Set up proper monitoring
   - Configure CDN for assets
   - Implement caching strategy

Happy coding! ⚽🚀