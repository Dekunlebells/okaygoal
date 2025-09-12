# OkayGoal Production Deployment Guide

This guide provides step-by-step instructions for deploying the OkayGoal football live scores application to production.

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <repository-url>
cd okaygoal

# 2. Setup secrets
./scripts/setup-secrets.sh all

# 3. Deploy backend
./scripts/deploy.sh

# 4. Deploy frontend  
./scripts/deploy-frontend.sh

# 5. Check deployment status
./scripts/deployment-status.sh full
```

## 📋 Prerequisites

### Required Accounts
1. **Railway** account for backend hosting
2. **Vercel** account for frontend hosting
3. **RapidAPI** account with API-Football subscription
4. **GitHub** account for CI/CD (optional)

### Required Tools
```bash
# Install required CLI tools
npm install -g @railway/cli
npm install -g vercel
npm install -g @github/cli (optional)

# Login to services
railway login
vercel login
gh auth login (optional)
```

### Environment Setup
- Node.js 18+ installed
- PostgreSQL client (for database operations)
- Redis CLI (for cache operations)
- Git configured with SSH keys

## 🗄️ Database Setup

### 1. Create Database Migration
```bash
# Create initial database schema
./scripts/migrate.sh migrate

# Check migration status
./scripts/migrate.sh status
```

### 2. Verify Database Connection
```bash
# Test connection
export DATABASE_URL="postgresql://username:password@hostname:port/database"
./scripts/migrate.sh status
```

## 🔑 Environment Configuration

### 1. Generate Secrets
```bash
# Generate JWT secrets and VAPID keys
./scripts/setup-secrets.sh generate

# Setup local environment
./scripts/setup-secrets.sh local
```

### 2. Configure Railway (Backend)
```bash
# Set environment variables in Railway
railway variables set NODE_ENV=production
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set API_FOOTBALL_KEY="your-rapidapi-key"
railway variables set FRONTEND_URL="https://okaygoal.vercel.app"

# Or use the setup script
./scripts/setup-secrets.sh railway
```

### 3. Configure Vercel (Frontend)
```bash
# Set frontend environment variables
vercel env add VITE_API_URL production
# Enter: https://okaygoal-backend.railway.app/api/v1

vercel env add VITE_WS_URL production  
# Enter: wss://okaygoal-backend.railway.app/ws

# Or use the setup script
./scripts/setup-secrets.sh vercel
```

## 🏈 API-Football Setup

### 1. Get API Key
1. Go to [RapidAPI API-Football](https://rapidapi.com/api-sports/api/api-football)
2. Subscribe to the API (free tier: 100 requests/day)
3. Copy your RapidAPI key

### 2. Test API Integration
```bash
export API_FOOTBALL_KEY="your-rapidapi-key"
./scripts/setup-api-football.sh test
```

### 3. Sync Initial Data
```bash
./scripts/setup-api-football.sh sync
```

## 🚂 Backend Deployment (Railway)

### 1. Prepare for Deployment
```bash
# Install dependencies and run tests
npm install
npm test

# Build the application
npm run build
```

### 2. Deploy to Railway
```bash
# Deploy using script
./scripts/deploy.sh

# Or deploy manually
railway up --environment production
```

### 3. Verify Deployment
```bash
# Check application health
./scripts/health-check.sh

# Monitor logs
railway logs --follow
```

## ▲ Frontend Deployment (Vercel)

### 1. Prepare Frontend
```bash
cd frontend
npm install
npm run test
npm run build
```

### 2. Deploy to Vercel
```bash
# Deploy using script
./scripts/deploy-frontend.sh

# Or deploy manually
vercel --prod
```

### 3. Verify Deployment
```bash
# Check deployment status
./scripts/deployment-status.sh quick
```

## 🔧 Post-Deployment Configuration

### 1. Database Migration
```bash
# Run database migrations on production
export DATABASE_URL="your-production-db-url"
./scripts/migrate.sh migrate
```

### 2. Health Checks
```bash
# Comprehensive health check
./scripts/health-check.sh check

# Generate health report
./scripts/health-check.sh report
```

### 3. Performance Testing
```bash
# Test application performance
./scripts/deployment-status.sh perf
```

## 📊 Monitoring and Maintenance

### 1. Health Monitoring
```bash
# Continuous monitoring (60 second intervals)
./scripts/health-check.sh monitor 60
```

### 2. Deployment Dashboard
```bash
# View full deployment status
./scripts/deployment-status.sh full
```

### 3. Log Monitoring
```bash
# Backend logs (Railway)
railway logs --follow

# Frontend logs (Vercel)
vercel logs
```

## 🔄 CI/CD Pipeline

The application includes GitHub Actions workflows for automated testing and deployment:

### Workflow Files
- `.github/workflows/ci.yml` - CI/CD pipeline
- `.github/workflows/frontend.yml` - Frontend-specific builds
- `.github/workflows/backend.yml` - Backend-specific builds

### Manual Trigger
```bash
# Trigger deployment via GitHub CLI
gh workflow run deploy.yml
```

## 🌐 Domain Configuration

### 1. Custom Domain (Optional)
```bash
# Add custom domain to Vercel
vercel domains add yourdomain.com

# Add custom domain to Railway
railway domain add api.yourdomain.com
```

### 2. SSL Certificates
Vercel and Railway automatically handle SSL certificates for custom domains.

## 📈 Scaling Considerations

### Backend Scaling (Railway)
- **Memory**: Start with 512MB, scale up based on usage
- **CPU**: Start with 0.5 CPU, monitor performance
- **Replicas**: Enable auto-scaling for high traffic

### Database Scaling
- **Connection Pooling**: Implemented via connection pool
- **Read Replicas**: Consider for high read loads
- **Caching**: Redis caching implemented for frequent queries

### CDN Configuration
- **Static Assets**: Automatically handled by Vercel
- **API Responses**: Consider implementing CDN for static API responses
- **Images**: Use image optimization services

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failures
```bash
# Check database URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. API-Football Rate Limits
```bash
# Check API usage
./scripts/setup-api-football.sh test

# Monitor API calls in logs
railway logs | grep "api-football"
```

#### 3. WebSocket Connection Issues
```bash
# Test WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
     -H "Sec-WebSocket-Version: 13" \
     https://okaygoal-backend.railway.app/ws
```

#### 4. Frontend Build Issues
```bash
cd frontend

# Clear cache and rebuild
npm run clean
npm install
npm run build

# Check environment variables
npm run build:debug
```

### Error Recovery

#### 1. Rollback Deployment
```bash
# Railway rollback
railway rollback

# Vercel rollback
vercel rollback
```

#### 2. Database Recovery
```bash
# Restore from backup
railway db:restore <backup-id>

# Reset database (development only)
./scripts/migrate.sh reset
```

## 📊 Performance Optimization

### 1. Backend Optimizations
- **Caching**: Redis caching for API responses
- **Connection Pooling**: Database connection pooling
- **Rate Limiting**: API rate limiting implemented
- **Compression**: Gzip compression enabled

### 2. Frontend Optimizations
- **Code Splitting**: Lazy loading for components
- **Image Optimization**: Lazy loading for images
- **Bundle Size**: Tree shaking and minification
- **CDN**: Static assets served via CDN

### 3. Database Optimizations
- **Indexing**: Proper database indexes
- **Query Optimization**: Efficient SQL queries
- **Connection Management**: Connection pooling

## 🔒 Security Checklist

### Backend Security
- [x] JWT token authentication
- [x] Refresh token rotation
- [x] Rate limiting
- [x] CORS configuration
- [x] Input validation
- [x] SQL injection protection
- [x] XSS protection
- [x] CSRF protection

### Frontend Security
- [x] Content Security Policy
- [x] XSS protection headers
- [x] Secure cookie settings
- [x] HTTPS enforcement
- [x] Dependency scanning

### Infrastructure Security
- [x] Environment variables protection
- [x] SSL/TLS certificates
- [x] Database access controls
- [x] API key rotation
- [x] Monitoring and alerting

## 📝 Maintenance Tasks

### Daily
- Monitor application health
- Check error logs
- Monitor API usage limits

### Weekly  
- Review performance metrics
- Update dependencies
- Check security vulnerabilities

### Monthly
- Database maintenance
- Backup verification
- Security audit
- Performance optimization review

## 📞 Support and Resources

### Documentation
- [API-Football Documentation](https://www.api-football.com/documentation-v3)
- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)

### Community
- [GitHub Issues](https://github.com/your-org/okaygoal/issues)
- [Discord Community](https://discord.gg/okaygoal)

### Emergency Contacts
- Technical Lead: [email]
- DevOps: [email]
- API Provider: RapidAPI Support

---

## 🎉 Deployment Complete!

Your OkayGoal application is now deployed and ready for users!

**Next Steps:**
1. 📊 Set up monitoring dashboards
2. 👥 Conduct user testing
3. 📱 Configure push notifications  
4. 🚀 Plan marketing launch
5. 📈 Monitor usage and scale as needed

**URLs:**
- **Frontend**: https://okaygoal.vercel.app
- **Backend API**: https://okaygoal-backend.railway.app/api/v1
- **Health Check**: https://okaygoal-backend.railway.app/health

Happy deploying! ⚽️🚀