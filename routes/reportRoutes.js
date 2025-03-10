const express = require('express');
const { getFinancialReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

const router = express.Router();


router.get('/', protect, getFinancialReport);

module.exports = router;
