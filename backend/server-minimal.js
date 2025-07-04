const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic CORS with preflight handling
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://astrova-frontend.onrender.com',
    'https://astrova-frontend-v2.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Basic middleware
app.use(express.json());

// Simple health check
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Simple ping
app.get('/ping', (req, res) => {
  console.log('Ping requested');
  res.status(200).send('pong');
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint requested');
  res.json({
    message: 'Astrova Backend API - Minimal Version',
    status: 'running',
    version: '1.0.0'
  });
});

// Handle preflight requests for API endpoint
app.options('/api/kundli', (req, res) => {
  console.log('Preflight request for /api/kundli');
  res.status(204).send();
});

// Simple API endpoint for testing
app.post('/api/kundli', (req, res) => {
  console.log('Kundli API called with:', req.body);
  res.json({
    success: true,
    message: 'Minimal API response - Swiss Ephemeris disabled for debugging',
    data: {
      birthDetails: req.body,
      note: 'This is a minimal response for testing deployment'
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal Astrova Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Signal readiness
  if (process.send) {
    process.send('ready');
  }
});

// Handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.log('Forcing exit...');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
