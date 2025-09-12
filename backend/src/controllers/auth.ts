import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/database/connection';
import { jwtManager } from '@/utils/jwt';
import { logger, loggerHelpers } from '@/utils/logger';
import { User, AuthResponse } from '@/types';

export class AuthController {
  // User registration
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, first_name, last_name } = req.body;

      // Check if user already exists
      const existingUser = await db.queryOne<User>(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'User already exists with this email'
        });
        return;
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = uuidv4();
      const user = await db.queryOne<User>(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, timezone, language, subscription_tier)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, first_name, last_name, timezone, language, subscription_tier, created_at`,
        [userId, email.toLowerCase(), password_hash, first_name, last_name, 'UTC', 'en', 'free']
      );

      if (!user) {
        throw new Error('Failed to create user');
      }

      // Create default user preferences
      await db.query(
        `INSERT INTO user_preferences (user_id, followed_teams, followed_players, followed_competitions, notification_settings)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          [],
          [],
          [],
          {
            goals: true,
            cards: false,
            lineups: true,
            final_results: true,
            news: true,
            push_enabled: true,
            email_enabled: false
          }
        ]
      );

      // Generate JWT tokens
      const tokens = jwtManager.generateTokenPair(user.id, user.email, user.subscription_tier);

      // Store refresh token in Redis with expiry
      await db.set(
        `refresh_token:${tokens.tokenId}`,
        JSON.stringify({ userId: user.id, email: user.email }),
        7 * 24 * 60 * 60 // 7 days
      );

      loggerHelpers.userAction(user.id, 'user_registered', {
        email: user.email,
        subscription_tier: user.subscription_tier
      });

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          timezone: user.timezone,
          language: user.language,
          subscription_tier: user.subscription_tier,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_active_at: user.last_active_at
        } as Omit<User, 'password_hash'>,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn
      };

      res.status(201).json({
        success: true,
        data: response,
        message: 'User registered successfully'
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }

  // User login
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await db.queryOne<User>(
        'SELECT * FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (!user) {
        loggerHelpers.security('login_attempt_invalid_email', 'medium', {
          email: email.toLowerCase(),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        loggerHelpers.security('login_attempt_invalid_password', 'medium', {
          userId: user.id,
          email: user.email,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });

        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // Generate JWT tokens
      const tokens = jwtManager.generateTokenPair(user.id, user.email, user.subscription_tier);

      // Store refresh token in Redis
      await db.set(
        `refresh_token:${tokens.tokenId}`,
        JSON.stringify({ userId: user.id, email: user.email }),
        7 * 24 * 60 * 60 // 7 days
      );

      // Update last active timestamp
      await db.query(
        'UPDATE users SET last_active_at = NOW() WHERE id = $1',
        [user.id]
      );

      loggerHelpers.userAction(user.id, 'user_login', {
        email: user.email,
        subscription_tier: user.subscription_tier,
        ip: req.ip
      });

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          avatar_url: user.avatar_url,
          timezone: user.timezone,
          language: user.language,
          subscription_tier: user.subscription_tier,
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_active_at: new Date()
        } as Omit<User, 'password_hash'>,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_in: tokens.expiresIn
      };

      res.json({
        success: true,
        data: response,
        message: 'Login successful'
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  // Refresh access token
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required'
        });
        return;
      }

      // Verify refresh token
      const decoded = jwtManager.verifyRefreshToken(refresh_token);

      // Check if refresh token exists in Redis
      const storedToken = await db.get(`refresh_token:${decoded.tokenId}`);

      if (!storedToken) {
        res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
        return;
      }

      const tokenData = JSON.parse(storedToken);

      // Get current user data
      const user = await db.queryOne<User>(
        'SELECT id, email, subscription_tier FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (!user) {
        // Clean up invalid refresh token
        await db.del(`refresh_token:${decoded.tokenId}`);
        res.status(401).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      // Generate new token pair
      const tokens = jwtManager.generateTokenPair(user.id, user.email, user.subscription_tier);

      // Store new refresh token and remove old one
      await db.del(`refresh_token:${decoded.tokenId}`);
      await db.set(
        `refresh_token:${tokens.tokenId}`,
        JSON.stringify({ userId: user.id, email: user.email }),
        7 * 24 * 60 * 60 // 7 days
      );

      loggerHelpers.userAction(user.id, 'token_refreshed', {
        email: user.email
      });

      res.json({
        success: true,
        data: {
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          expires_in: tokens.expiresIn
        },
        message: 'Token refreshed successfully'
      });

    } catch (error: any) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed'
      });
    }
  }

  // User logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refresh_token } = req.body;

      if (refresh_token) {
        try {
          const decoded = jwtManager.verifyRefreshToken(refresh_token);
          
          // Remove refresh token from Redis
          await db.del(`refresh_token:${decoded.tokenId}`);
        } catch (error) {
          // Token might be invalid or expired, which is fine for logout
          logger.debug('Invalid refresh token during logout:', error);
        }
      }

      if (req.user) {
        loggerHelpers.userAction(req.user.userId, 'user_logout', {
          email: req.user.email
        });
      }

      res.json({
        success: true,
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  // Get current user profile
  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const user = await db.queryOne<User>(
        `SELECT id, email, first_name, last_name, avatar_url, timezone, language, 
                subscription_tier, created_at, updated_at, last_active_at
         FROM users WHERE id = $1`,
        [req.user.userId]
      );

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: user
      });

    } catch (error) {
      logger.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }

  // Verify token endpoint (for other services)
  static async verify(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(400).json({
          success: false,
          error: 'Token is required'
        });
        return;
      }

      const token = authHeader.substring(7);
      const payload = jwtManager.verifyAccessToken(token);

      const user = await db.queryOne<User>(
        'SELECT id, email, subscription_tier FROM users WHERE id = $1',
        [payload.userId]
      );

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          valid: true,
          user: {
            id: user.id,
            email: user.email,
            subscription_tier: user.subscription_tier
          },
          expires_at: new Date(payload.exp * 1000)
        }
      });

    } catch (error: any) {
      res.status(401).json({
        success: false,
        data: {
          valid: false,
          error: error.message || 'Invalid token'
        }
      });
    }
  }
}