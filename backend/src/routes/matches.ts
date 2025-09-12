import { Router } from 'express';
// TODO: Implement match controllers and routes
const router = Router();

// Placeholder routes - will be implemented after API-Football integration
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Matches endpoint - coming soon',
    endpoints: {
      live: '/live',
      today: '/today',
      fixture: '/:id',
      events: '/:id/events',
      statistics: '/:id/statistics'
    }
  });
});

export default router;