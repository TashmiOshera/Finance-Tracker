const express = require('express');
const { getDashboardData } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();


router.get('/dashboard', protect, getDashboardData);

module.exports = router;
