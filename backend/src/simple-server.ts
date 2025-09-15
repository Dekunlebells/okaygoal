import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { createClient } from 'redis';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Basic middleware
app.use(express.json());

// Simple database connections
let pgPool: Pool | null = null;
let redisClient: any = null;

// Initialize databases if environment variables are available
if (process.env.DATABASE_URL) {
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
}

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL
  });
  redisClient.connect().catch(console.error);
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
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.ping();
      health.database.redis = true;
    } catch (error) {
      console.log('Redis check failed:', error);
    }
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