import { Request, Response, NextFunction } from 'express';
import { jwtManager, JwtPayload } from '@/utils/jwt';
import { db } from '@/database/connection';
import { logger, loggerHelpers } from '@/utils/logger';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      rateLimitInfo?: {
        tier: string;
        remaining: number;
        reset: Date;
      };
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    
    try {
      const payload = jwtManager.verifyAccessToken(token);
      
      // Verify user still exists and is active
      const user = await db.queryOne(
        'SELECT id, email, subscription_tier, created_at FROM users WHERE id = $1',
        [payload.userId]
      );

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Update last active timestamp
      await db.query(
        'UPDATE users SET last_active_at = NOW() WHERE id = $1',
        [payload.userId]
      );

      req.user = payload;
      next();

    } catch (tokenError: any) {
      loggerHelpers.security('invalid_token_attempt', 'medium', {
        token: token.substring(0, 20) + '...',
        error: tokenError.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(401).json({
        success: false,
        error: tokenError.message || 'Invalid token'
      });
      return;
    }

  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Optional authentication middleware (for endpoints that work with or without auth)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = jwtManager.verifyAccessToken(token);
    
    const user = await db.queryOne(
      'SELECT id, email, subscription_tier FROM users WHERE id = $1',
      [payload.userId]
    );

    if (user) {
      req.user = payload;
      
      // Update last active timestamp
      await db.query(
        'UPDATE users SET last_active_at = NOW() WHERE id = $1',
        [payload.userId]
      );
    }
  } catch (error) {
    // Silently ignore token errors for optional auth
    logger.debug('Optional auth token validation failed:', error);
  }
  
  next();
};

// Subscription tier middleware
export const requireSubscription = (requiredTier: 'premium' | 'pro') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const tierHierarchy = { free: 0, premium: 1, pro: 2 };
    const userTierLevel = tierHierarchy[req.user.subscription_tier as keyof typeof tierHierarchy] || 0;
    const requiredTierLevel = tierHierarchy[requiredTier];

    if (userTierLevel < requiredTierLevel) {
      loggerHelpers.userAction(req.user.userId, 'subscription_required', {
        requiredTier,
        userTier: req.user.subscription_tier,
        endpoint: req.path
      });

      res.status(403).json({
        success: false,
        error: `${requiredTier} subscription required`,
        upgrade_required: true,
        user_tier: req.user.subscription_tier,
        required_tier: requiredTier
      });
      return;
    }

    next();
  };
};

// Admin middleware (for future admin endpoints)
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  // TODO: Implement admin role checking
  // For now, only allow specific user IDs or subscription tier
  if (req.user.subscription_tier !== 'pro') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
    return;
  }

  next();
};