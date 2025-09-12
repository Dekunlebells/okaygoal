import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';

// Import utilities and middleware
import { logger, loggerHelpers } from '@/utils/logger';
import { db } from '@/database/connection';
import { dynamicRateLimit } from '@/middleware/rateLimit';

// Import routes
import authRoutes from '@/routes/auth';
import matchRoutes from '@/routes/matches';
import competitionRoutes from '@/routes/competitions';
import teamRoutes from '@/routes/teams';
import playerRoutes from '@/routes/players';
import userRoutes from '@/routes/users';
import { setupWebSocket } from '@/services/websocket';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Environment configuration
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'];

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    // In development, allow localhost with any port
    if (NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    loggerHelpers.httpRequest(
      req.method,
      req.url,
      res.statusCode,
      duration
    );

    // Log slow requests
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration,
        statusCode: res.statusCode
      });
    }
  });

  next();
});

// Health check endpoint (before rate limiting)
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Simple health check without database dependency for initial deployment
    let health = { postgres: false, redis: false };
    
    // Try to check database if available
    try {
      health = await db.healthCheck();
    } catch (error) {
      // Database not available yet - that's OK for initial deployment
      logger.info('Database not available yet, continuing with basic health check');
    }
    
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      database: {
        postgres: health.postgres,
        redis: health.redis
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'Service unavailable'
    });
  }
});

// Rate limiting middleware
app.use(dynamicRateLimit);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/matches', matchRoutes);
app.use('/api/v1/competitions', competitionRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/users', userRoutes);

// API documentation endpoint
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'OkayGoal API v1.0',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      authentication: '/api/v1/auth',
      matches: '/api/v1/matches',
      competitions: '/api/v1/competitions',
      teams: '/api/v1/teams',
      players: '/api/v1/players',
      users: '/api/v1/users'
    },
    websocket: {
      url: `ws://localhost:${PORT}/ws`,
      endpoints: [
        '/ws/live-scores',
        '/ws/matches/{matchId}/live',
        '/ws/user/{userId}/notifications'
      ]
    }
  });
});

// 404 handler for API routes
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Don't leak error details in production
  const message = NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(500).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 404 handler for all other routes
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Setup WebSocket server
const wss = new WebSocketServer({ 
  server, 
  path: '/ws',
  clientTracking: true,
  maxPayload: 1024 * 1024 // 1MB max message size
});

setupWebSocket(wss);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, starting graceful shutdown');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    db.close().then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error closing database connections:', error);
      process.exit(1);
    });
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, starting graceful shutdown');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    db.close().then(() => {
      logger.info('Database connections closed');
      process.exit(0);
    }).catch((error) => {
      logger.error('Error closing database connections:', error);
      process.exit(1);
    });
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error('Unhandled Promise Rejection:', { reason, promise });
});

// Uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 OkayGoal API server started`, {
    port: PORT,
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    pid: process.pid
  });
});

export default app;