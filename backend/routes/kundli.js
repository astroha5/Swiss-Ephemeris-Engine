const express = require('express');
const router = express.Router();
const kundliController = require('../controllers/kundliController');
const logger = require('../utils/logger');

// POST /api/kundli
// Generate complete birth chart with planetary positions, houses, yogas, and doshas
router.post('/', kundliController.generateKundli);

module.exports = router;
