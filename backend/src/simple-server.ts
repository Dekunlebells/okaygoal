import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://okaygoal-eight.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Basic middleware
app.use(express.json());

// Simple database connections
let pgPool: Pool | null = null;
let redisClient: any = null;

// Initialize databases if environment variables are available
if (process.env.DATABASE_URL) {
  console.log('Initializing PostgreSQL connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 5,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    allowExitOnIdle: true
  });
  
  // Test connection with retry logic
  const testPostgresConnection = async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        const client = await pgPool.connect();
        await client.query('SELECT NOW()');
        client.release();
        console.log('PostgreSQL connected successfully');
        return;
      } catch (err) {
        console.error(`PostgreSQL connection failed (${retries} retries left):`, err.message);
        console.error('Full error:', err);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    console.error('PostgreSQL: All connection attempts failed');
  };
  
  testPostgresConnection();
}

// Redis connection - try to connect but don't fail if it doesn't work
if (process.env.REDIS_URL) {
  console.log('Initializing Redis connection...');
  console.log('REDIS_URL exists:', !!process.env.REDIS_URL);
  
  const connectRedis = async () => {
    let retries = 3;
    while (retries > 0) {
      try {
        redisClient = createClient({
          url: process.env.REDIS_URL,
          socket: {
            connectTimeout: 15000,
            reconnectStrategy: (retries) => Math.min(retries * 50, 500)
          }
        });
        
        await redisClient.connect();
        await redisClient.ping();
        console.log('Redis connected successfully');
        return;
      } catch (error) {
        console.error(`Redis connection failed (${retries} retries left):`, error.message);
        console.error('Full Redis error:', error);
        redisClient = null;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    console.error('Redis: All connection attempts failed, continuing without Redis');
  };
  
  connectRedis();
} else {
  console.log('No REDIS_URL found, skipping Redis connection');
}

// Health check endpoint with database status
app.get('/health', async (req, res) => {
  const health = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: {
      postgres: false,
      redis: false
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    }
  };

  // Check PostgreSQL
  if (pgPool) {
    try {
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      health.database.postgres = true;
      console.log('PostgreSQL health check passed');
    } catch (error) {
      console.log('PostgreSQL health check failed:', error.message);
      console.log('PostgreSQL pool totalCount:', pgPool.totalCount);
      console.log('PostgreSQL pool idleCount:', pgPool.idleCount);
    }
  } else {
    console.log('PostgreSQL pool not initialized - DATABASE_URL missing or invalid');
  }

  // Check Redis
  if (redisClient) {
    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        health.database.redis = true;
        console.log('Redis health check passed');
      } else {
        console.log('Redis client exists but not connected');
      }
    } catch (error) {
      console.log('Redis health check failed:', error.message);
    }
  } else {
    console.log('Redis client not initialized - REDIS_URL missing or connection failed');
  }

  res.status(200).json(health);
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'OkayGoal API Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Demo auth endpoints
app.post('/api/v1/auth/login', (req, res) => {
  console.log('Login request received:', req.body);
  const { email, password } = req.body;
  
  // Demo account login
  if (email === 'demo@okaygoal.com' && password === 'demo123456') {
    console.log('Demo login successful');
    res.json({
      success: true,
      message: 'Login successful',
      token: 'demo-jwt-token-12345',
      user: {
        id: 1,
        name: 'Demo User',
        email: 'demo@okaygoal.com',
        role: 'user'
      }
    });
  } else {
    console.log('Invalid credentials:', email);
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Test endpoint to verify API is working
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database_url_exists: !!process.env.DATABASE_URL,
    redis_url_exists: !!process.env.REDIS_URL
  });
});

app.post('/api/v1/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Registration successful',
    token: 'demo-jwt-token-12345',
    user: {
      id: 2,
      name: req.body.name || 'New User',
      email: req.body.email,
      role: 'user'
    }
  });
});

// Demo matches endpoint
app.get('/api/v1/matches', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        homeScore: 2,
        awayScore: 1,
        status: 'finished',
        date: new Date().toISOString()
      },
      {
        id: 2,
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        homeScore: 1,
        awayScore: 1,
        status: 'finished',
        date: new Date().toISOString()
      }
    ]
  });
});

// Demo competitions endpoint
app.get('/api/v1/competitions', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Premier League', country: 'England' },
      { id: 2, name: 'La Liga', country: 'Spain' },
      { id: 3, name: 'Bundesliga', country: 'Germany' }
    ]
  });
});

// Demo teams endpoint
app.get('/api/v1/teams', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Manchester United', league: 'Premier League' },
      { id: 2, name: 'Liverpool', league: 'Premier League' },
      { id: 3, name: 'Arsenal', league: 'Premier League' }
    ]
  });
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database URL: ${process.env.DATABASE_URL ? 'Available' : 'Not set'}`);
  console.log(`Redis URL: ${process.env.REDIS_URL ? 'Available' : 'Not set'}`);
}).on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

export default app;