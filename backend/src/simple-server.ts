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
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  });
  
  // Test connection immediately
  pgPool.connect()
    .then(() => {
      console.log('PostgreSQL connected successfully');
    })
    .catch((err) => {
      console.error('PostgreSQL connection failed:', err.message);
    });
}

// Redis connection - try to connect but don't fail if it doesn't work
if (process.env.REDIS_URL) {
  console.log('Initializing Redis connection...');
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    redisClient.connect().then(() => {
      console.log('Redis connected successfully');
    }).catch((error) => {
      console.log('Redis connection failed, continuing without Redis:', error.message);
      redisClient = null;
    });
  } catch (error) {
    console.log('Redis initialization failed, continuing without Redis:', error);
    redisClient = null;
  }
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
      await pgPool.query('SELECT 1');
      health.database.postgres = true;
    } catch (error) {
      console.log('PostgreSQL check failed:', error);
    }
  }

  // Check Redis
  if (redisClient) {
    try {
      if (redisClient.isOpen) {
        await redisClient.ping();
        health.database.redis = true;
      } else {
        console.log('Redis client not connected');
      }
    } catch (error) {
      console.log('Redis check failed:', error);
    }
  } else {
    console.log('Redis client not initialized');
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
    timestamp: new Date().toISOString()
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