const express = require('express');
const router = express.Router();
const planetaryPositionsController = require('../controllers/planetaryPositionsController');

// Route for getting planetary positions for any date/time/location
router.post('/', planetaryPositionsController.getPlanetaryPositions);

module.exports = router;
