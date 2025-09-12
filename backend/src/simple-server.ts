import express from 'express';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST
  });
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
}).on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

export default app;