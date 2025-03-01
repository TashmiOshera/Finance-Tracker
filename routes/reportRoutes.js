const express = require('express');
const { getFinancialReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route GET /api/reports
router.get('/', protect, getFinancialReport);

module.exports = router;
