import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { db } from '@/database/connection';
import { logger, loggerHelpers } from '@/utils/logger';

// Rate limit configuration based on user tier
const rateLimitConfig = {
  free: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: {
      success: false,
      error: 'Rate limit exceeded for free tier',
      limit: 1000,
      windowMs: 15 * 60 * 1000,
      upgrade_suggestion: 'Upgrade to premium for higher limits'
    }
  },
  premium: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // 10000 requests per window
    message: {
      success: false,
      error: 'Rate limit exceeded for premium tier',
      limit: 10000,
      windowMs: 15 * 60 * 1000
    }
  },
  pro: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50000, // 50000 requests per window
    message: {
      success: false,
      error: 'Rate limit exceeded for pro tier',
      limit: 50000,
      windowMs: 15 * 60 * 1000
    }
  }
};

// Custom key generator that considers user subscription tier
const keyGenerator = (req: Request): string => {
  if (req.user) {
    return `user:${req.user.userId}`;
  }
  return `ip:${req.ip}`;
};

// Skip function for internal health checks
const skipSuccessfulRequests = (req: Request, res: Response): boolean => {
  return req.path === '/health' || req.path === '/api/v1/health';
};

// Custom handler for rate limit exceeded
const rateLimitHandler = (req: Request, res: Response): void => {
  const tier = req.user?.subscription_tier || 'free';
  const config = rateLimitConfig[tier as keyof typeof rateLimitConfig] || rateLimitConfig.free;

  loggerHelpers.security('rate_limit_exceeded', 'medium', {
    userId: req.user?.userId,
    ip: req.ip,
    tier,
    path: req.path,
    method: req.method
  });

  res.status(429).json(config.message);
};

// Dynamic rate limiter based on user tier
export const dynamicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // Will be overridden per request
  max: (req: Request) => {
    const tier = req.user?.subscription_tier || 'free';
    const config = rateLimitConfig[tier as keyof typeof rateLimitConfig] || rateLimitConfig.free;
    return config.max;
  },
  keyGenerator,
  skip: skipSuccessfulRequests,
  handler: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  // Custom store using Redis for distributed rate limiting
  store: {
    incr: async (key: string): Promise<{ totalHits: number; resetTime?: Date }> => {
      const redis = db.getRedis();
      const windowStart = Math.floor(Date.now() / (15 * 60 * 1000)) * (15 * 60 * 1000);
      const redisKey = `ratelimit:${key}:${windowStart}`;
      
      try {
        const totalHits = await redis.incr(redisKey);
        
        if (totalHits === 1) {
          await redis.expire(redisKey, 15 * 60); // 15 minutes
        }
        
        const resetTime = new Date(windowStart + (15 * 60 * 1000));
        return { totalHits, resetTime };
      } catch (error) {
        logger.error('Redis rate limit error:', error);
        return { totalHits: 1 };
      }
    },
    decrement: async (key: string): Promise<void> => {
      // Optional: implement decrement for failed requests
    },
    resetKey: async (key: string): Promise<void> => {
      const redis = db.getRedis();
      const windowStart = Math.floor(Date.now() / (15 * 60 * 1000)) * (15 * 60 * 1000);
      const redisKey = `ratelimit:${key}:${windowStart}`;
      
      try {
        await redis.del(redisKey);
      } catch (error) {
        logger.error('Redis rate limit reset error:', error);
      }
    }
  }
});

// Endpoint-specific rate limiters
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Very strict for sensitive endpoints
  keyGenerator,
  handler: rateLimitHandler,
  message: {
    success: false,
    error: 'Too many requests to sensitive endpoint',
    limit: 10,
    windowMs: 15 * 60 * 1000
  }
});

// Auth endpoints rate limiter
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 auth attempts per 15 minutes
  keyGenerator: (req: Request) => `auth:${req.ip}`,
  handler: (req: Request, res: Response) => {
    loggerHelpers.security('auth_rate_limit_exceeded', 'high', {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts',
      limit: 20,
      windowMs: 15 * 60 * 1000,
      retryAfter: Math.ceil(15 * 60 / 60) // minutes
    });
  }
});

// WebSocket connection rate limiter
export const websocketRateLimit = {
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 messages per minute per connection
  
  async checkLimit(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const redis = db.getRedis();
    const windowStart = Math.floor(Date.now() / 60000) * 60000;
    const key = `ws_ratelimit:${userId}:${windowStart}`;
    
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, 60);
      }
      
      const remaining = Math.max(0, this.max - current);
      return {
        allowed: current <= this.max,
        remaining
      };
    } catch (error) {
      logger.error('WebSocket rate limit check error:', error);
      return { allowed: true, remaining: this.max };
    }
  }
};