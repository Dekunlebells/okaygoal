import { Router } from 'express';
import { authenticate, optionalAuth } from '@/middleware/auth';
import { validate, schemas } from '@/middleware/validation';
import { db } from '@/database/connection';
import { logger, loggerHelpers } from '@/utils/logger';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const preferences = await db.queryOne(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.userId]
    );

    if (!preferences) {
      // Create default preferences if they don't exist
      const defaultPreferences = {
        followed_teams: [],
        followed_players: [],
        followed_competitions: [],
        notification_settings: {
          goals: true,
          cards: false,
          lineups: true,
          final_results: true,
          news: true,
          push_enabled: true,
          email_enabled: false
        }
      };

      await db.query(
        `INSERT INTO user_preferences (user_id, followed_teams, followed_players, followed_competitions, notification_settings)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.userId,
          defaultPreferences.followed_teams,
          defaultPreferences.followed_players,
          defaultPreferences.followed_competitions,
          defaultPreferences.notification_settings
        ]
      );

      res.json({
        success: true,
        data: defaultPreferences
      });
      return;
    }

    res.json({
      success: true,
      data: {
        followed_teams: preferences.followed_teams || [],
        followed_players: preferences.followed_players || [],
        followed_competitions: preferences.followed_competitions || [],
        notification_settings: preferences.notification_settings
      }
    });

  } catch (error) {
    logger.error('Get user preferences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user preferences'
    });
  }
});

// Update user preferences
router.put('/preferences',
  validate(schemas.updatePreferences),
  async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const updates = [];
      const values = [req.user.userId];
      let valueIndex = 2;

      if (req.body.followed_teams !== undefined) {
        updates.push(`followed_teams = $${valueIndex}`);
        values.push(req.body.followed_teams);
        valueIndex++;
      }

      if (req.body.followed_players !== undefined) {
        updates.push(`followed_players = $${valueIndex}`);
        values.push(req.body.followed_players);
        valueIndex++;
      }

      if (req.body.followed_competitions !== undefined) {
        updates.push(`followed_competitions = $${valueIndex}`);
        values.push(req.body.followed_competitions);
        valueIndex++;
      }

      if (req.body.notification_settings !== undefined) {
        // Merge with existing settings
        const existing = await db.queryOne(
          'SELECT notification_settings FROM user_preferences WHERE user_id = $1',
          [req.user.userId]
        );

        const mergedSettings = {
          ...existing?.notification_settings,
          ...req.body.notification_settings
        };

        updates.push(`notification_settings = $${valueIndex}`);
        values.push(JSON.stringify(mergedSettings));
        valueIndex++;
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
        return;
      }

      updates.push('updated_at = NOW()');

      const query = `
        UPDATE user_preferences 
        SET ${updates.join(', ')}
        WHERE user_id = $1
        RETURNING *
      `;

      const result = await db.queryOne(query, values);

      loggerHelpers.userAction(req.user.userId, 'preferences_updated', {
        updatedFields: Object.keys(req.body)
      });

      res.json({
        success: true,
        data: result,
        message: 'Preferences updated successfully'
      });

    } catch (error) {
      logger.error('Update user preferences error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user preferences'
      });
    }
  }
);

// Update user profile
router.put('/profile',
  validate(schemas.updateProfile),
  async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const updates = [];
      const values = [req.user.userId];
      let valueIndex = 2;

      if (req.body.first_name !== undefined) {
        updates.push(`first_name = $${valueIndex}`);
        values.push(req.body.first_name);
        valueIndex++;
      }

      if (req.body.last_name !== undefined) {
        updates.push(`last_name = $${valueIndex}`);
        values.push(req.body.last_name);
        valueIndex++;
      }

      if (req.body.timezone !== undefined) {
        updates.push(`timezone = $${valueIndex}`);
        values.push(req.body.timezone);
        valueIndex++;
      }

      if (req.body.language !== undefined) {
        updates.push(`language = $${valueIndex}`);
        values.push(req.body.language);
        valueIndex++;
      }

      if (updates.length === 0) {
        res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
        return;
      }

      updates.push('updated_at = NOW()');

      const query = `
        UPDATE users 
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING id, email, first_name, last_name, timezone, language, subscription_tier, updated_at
      `;

      const result = await db.queryOne(query, values);

      loggerHelpers.userAction(req.user.userId, 'profile_updated', {
        updatedFields: Object.keys(req.body)
      });

      res.json({
        success: true,
        data: result,
        message: 'Profile updated successfully'
      });

    } catch (error) {
      logger.error('Update user profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update user profile'
      });
    }
  }
);

// Follow/unfollow team, player, or competition
router.post('/follow',
  validate(schemas.follow),
  async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { type, id } = req.body;
      const fieldMap = {
        team: 'followed_teams',
        player: 'followed_players',
        competition: 'followed_competitions'
      };

      const field = fieldMap[type as keyof typeof fieldMap];

      // Get current preferences
      const preferences = await db.queryOne(
        `SELECT ${field} FROM user_preferences WHERE user_id = $1`,
        [req.user.userId]
      );

      if (!preferences) {
        res.status(404).json({
          success: false,
          error: 'User preferences not found'
        });
        return;
      }

      const currentList = preferences[field] || [];
      
      if (currentList.includes(id)) {
        res.status(409).json({
          success: false,
          error: `Already following this ${type}`
        });
        return;
      }

      const updatedList = [...currentList, id];

      await db.query(
        `UPDATE user_preferences SET ${field} = $1, updated_at = NOW() WHERE user_id = $2`,
        [updatedList, req.user.userId]
      );

      loggerHelpers.userAction(req.user.userId, 'follow_added', {
        type,
        id
      });

      res.json({
        success: true,
        message: `Successfully following ${type}`,
        data: { type, id, following: true }
      });

    } catch (error) {
      logger.error('Follow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to follow'
      });
    }
  }
);

// Unfollow
router.delete('/follow',
  validate(schemas.follow),
  async (req, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { type, id } = req.body;
      const fieldMap = {
        team: 'followed_teams',
        player: 'followed_players',
        competition: 'followed_competitions'
      };

      const field = fieldMap[type as keyof typeof fieldMap];

      // Get current preferences
      const preferences = await db.queryOne(
        `SELECT ${field} FROM user_preferences WHERE user_id = $1`,
        [req.user.userId]
      );

      if (!preferences) {
        res.status(404).json({
          success: false,
          error: 'User preferences not found'
        });
        return;
      }

      const currentList = preferences[field] || [];
      const updatedList = currentList.filter((item: number) => item !== id);

      await db.query(
        `UPDATE user_preferences SET ${field} = $1, updated_at = NOW() WHERE user_id = $2`,
        [updatedList, req.user.userId]
      );

      loggerHelpers.userAction(req.user.userId, 'follow_removed', {
        type,
        id
      });

      res.json({
        success: true,
        message: `Successfully unfollowed ${type}`,
        data: { type, id, following: false }
      });

    } catch (error) {
      logger.error('Unfollow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unfollow'
      });
    }
  }
);

export default router;