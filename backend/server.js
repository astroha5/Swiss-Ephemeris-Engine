const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./utils/errorHandler');

// Import routes
const kundliRoutes = require('./routes/kundli');
const panchangRoutes = require('./routes/panchang');
const dashaRoutes = require('./routes/dasha');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - exclude OPTIONS requests (CORS preflight)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // increased limit for production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  skip: (req) => {
    // Skip rate limiting for CORS preflight requests
    return req.method === 'OPTIONS';
  }
});
app.use('/api/', limiter);

// CORS configuration for frontend
app.use(cors({
  origin: [
    'http://localhost:4028',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://astrova.vercel.app',
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

// Middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint (simplified for faster response)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Simple ping endpoint for Render health checks
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// API routes
app.use('/api/kundli', kundliRoutes);
app.use('/api/panchang', panchangRoutes);
app.use('/api/dasha', dashaRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Astrova Backend API',
    version: '1.0.0',
    description: 'High-accuracy Vedic astrology calculations with Swiss Ephemeris',
    endpoints: {
      kundli: '/api/kundli',
      panchang: '/api/panchang',
      dasha: '/api/dasha',
      health: '/health'
    },
    documentation: 'https://github.com/astrova/backend#api-documentation'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Astrova Backend running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📚 API docs: http://localhost:${PORT}/`);
  
  // Signal to Render that the server is ready
  if (process.send) {
    process.send('ready');
  }
});

// Handle server startup errors
server.on('error', (error) => {
  logger.error('Server startup error:', error);
  if (error.syscall !== 'listen') {
    throw error;
  }
  
  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});

module.exports = app;
