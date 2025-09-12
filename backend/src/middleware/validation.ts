import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '@/utils/logger';

// Validation middleware factory
export const validate = (schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const errors: string[] = [];

      // Validate request body
      if (schema.body) {
        const bodyResult = schema.body.safeParse(req.body);
        if (!bodyResult.success) {
          errors.push(...bodyResult.error.errors.map(err => 
            `Body: ${err.path.join('.')} - ${err.message}`
          ));
        } else {
          req.body = bodyResult.data;
        }
      }

      // Validate query parameters
      if (schema.query) {
        const queryResult = schema.query.safeParse(req.query);
        if (!queryResult.success) {
          errors.push(...queryResult.error.errors.map(err => 
            `Query: ${err.path.join('.')} - ${err.message}`
          ));
        } else {
          req.query = queryResult.data;
        }
      }

      // Validate URL parameters
      if (schema.params) {
        const paramsResult = schema.params.safeParse(req.params);
        if (!paramsResult.success) {
          errors.push(...paramsResult.error.errors.map(err => 
            `Params: ${err.path.join('.')} - ${err.message}`
          ));
        } else {
          req.params = paramsResult.data;
        }
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Validation processing failed'
      });
    }
  };
};

// Common validation schemas
export const schemas = {
  // Authentication schemas
  register: {
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain lowercase, uppercase, and number'),
      first_name: z.string().min(1).max(100).optional(),
      last_name: z.string().min(1).max(100).optional()
    })
  },

  login: {
    body: z.object({
      email: z.string().email('Invalid email format'),
      password: z.string().min(1, 'Password is required')
    })
  },

  // User management schemas
  updateProfile: {
    body: z.object({
      first_name: z.string().min(1).max(100).optional(),
      last_name: z.string().min(1).max(100).optional(),
      timezone: z.string().max(50).optional(),
      language: z.string().length(2).optional()
    })
  },

  updatePreferences: {
    body: z.object({
      followed_teams: z.array(z.number()).optional(),
      followed_players: z.array(z.number()).optional(),
      followed_competitions: z.array(z.number()).optional(),
      notification_settings: z.object({
        goals: z.boolean().optional(),
        cards: z.boolean().optional(),
        lineups: z.boolean().optional(),
        final_results: z.boolean().optional(),
        news: z.boolean().optional(),
        push_enabled: z.boolean().optional(),
        email_enabled: z.boolean().optional()
      }).optional()
    })
  },

  // Match and competition schemas
  matchId: {
    params: z.object({
      id: z.string().regex(/^\d+$/, 'Match ID must be a number').transform(Number)
    })
  },

  competitionId: {
    params: z.object({
      id: z.string().regex(/^\d+$/, 'Competition ID must be a number').transform(Number)
    })
  },

  teamId: {
    params: z.object({
      id: z.string().regex(/^\d+$/, 'Team ID must be a number').transform(Number)
    })
  },

  playerId: {
    params: z.object({
      id: z.string().regex(/^\d+$/, 'Player ID must be a number').transform(Number)
    })
  },

  // Pagination schemas
  pagination: {
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, 'Page must be positive').optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be 1-100').optional().default('20'),
      sort: z.enum(['date', 'name', 'position', 'updated_at']).optional(),
      order: z.enum(['asc', 'desc']).optional().default('desc')
    })
  },

  // Date range schemas
  dateRange: {
    query: z.object({
      start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD format').optional(),
      end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD format').optional(),
      season: z.string().max(20).optional()
    }).refine(data => {
      if (data.start_date && data.end_date) {
        return new Date(data.start_date) <= new Date(data.end_date);
      }
      return true;
    }, 'Start date must be before end date')
  },

  // Search schemas
  search: {
    query: z.object({
      q: z.string().min(2, 'Search query must be at least 2 characters').max(100),
      type: z.enum(['teams', 'players', 'competitions', 'all']).optional().default('all'),
      limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 50, 'Limit must be 1-50').optional().default('10')
    })
  },

  // Live matches query
  liveMatches: {
    query: z.object({
      competition_ids: z.string().optional().transform(str => 
        str ? str.split(',').map(Number).filter(n => !isNaN(n)) : undefined
      ),
      team_ids: z.string().optional().transform(str => 
        str ? str.split(',').map(Number).filter(n => !isNaN(n)) : undefined
      )
    })
  },

  // Follow/unfollow schemas
  follow: {
    body: z.object({
      type: z.enum(['team', 'player', 'competition']),
      id: z.number().positive('ID must be a positive number')
    })
  }
};

// Sanitization helpers
export const sanitize = {
  // Remove HTML tags and dangerous characters
  html: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>'"&]/g, '') // Remove dangerous characters
      .trim();
  },

  // Sanitize search query
  searchQuery: (query: string): string => {
    return query
      .replace(/[^\w\s-]/g, '') // Only allow alphanumeric, spaces, and hyphens
      .trim()
      .toLowerCase();
  },

  // Sanitize team/player names for database storage
  name: (name: string): string => {
    return name
      .replace(/[^\w\s\-'.]/g, '') // Allow letters, spaces, hyphens, apostrophes, dots
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }
};