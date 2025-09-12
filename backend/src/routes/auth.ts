import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '@/controllers/auth';
import { validate, schemas } from '@/middleware/validation';
import { authRateLimit, strictRateLimit } from '@/middleware/rateLimit';
import { authenticate } from '@/middleware/auth';

const router = Router();

// Apply auth-specific rate limiting
router.use(authRateLimit);

// Register new user
router.post('/register', 
  validate(schemas.register),
  AuthController.register
);

// User login
router.post('/login',
  validate(schemas.login),
  AuthController.login
);

// Refresh access token
router.post('/refresh',
  validate({
    body: z.object({
      refresh_token: z.string().min(1, 'Refresh token is required')
    })
  }),
  AuthController.refresh
);

// User logout
router.delete('/logout',
  validate({
    body: z.object({
      refresh_token: z.string().optional()
    })
  }),
  AuthController.logout
);

// Get current user profile (requires authentication)
router.get('/me',
  authenticate,
  AuthController.me
);

// Verify token (for other services)
router.post('/verify',
  strictRateLimit,
  AuthController.verify
);

export default router;