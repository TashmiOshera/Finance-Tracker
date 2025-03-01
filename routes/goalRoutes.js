const express = require('express');
const { addGoal, getGoals, } = require('../controllers/goalController');
const { allocateSavings } = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, addGoal); // Add a financial goal
router.get('/', protect, getGoals); // Get all financial goals for the user

module.exports = router;
