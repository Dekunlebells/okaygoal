import { Router } from 'express';
// TODO: Implement player controllers and routes
const router = Router();

// Placeholder routes - will be implemented after API-Football integration
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Players endpoint - coming soon',
    endpoints: {
      search: '/?q=search_term',
      details: '/:id',
      statistics: '/:id/statistics',
      transfers: '/:id/transfers'
    }
  });
});

export default router;