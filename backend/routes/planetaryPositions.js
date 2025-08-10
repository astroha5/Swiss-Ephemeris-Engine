const express = require('express');
const router = express.Router();
const planetaryPositionsController = require('../controllers/planetaryPositionsController');

// Route for getting planetary positions for any date/time/location
router.post('/', planetaryPositionsController.getPlanetaryPositions);

// Route for generating pattern-aware predictive report, storing snapshot and matches
router.post('/report', planetaryPositionsController.generateReport);

module.exports = router;
