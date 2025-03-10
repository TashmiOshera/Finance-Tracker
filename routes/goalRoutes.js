const express = require('express');
const { addGoal, getGoals, updateGoal, deleteGoal } = require('../controllers/goalController');
const { protect } = require('../middleware/auth');

const router = express.Router();


router.post('/', protect, addGoal);


router.get('/', protect, getGoals);


router.put('/:id', protect, updateGoal);


router.delete('/:id', protect, deleteGoal);

module.exports = router;
