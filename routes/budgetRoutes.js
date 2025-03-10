const express = require('express');
const {
  createBudget,
  getUserBudgets,
  deleteBudgetByCategory,
  updateBudget,
  getBudgetByCategory,
  getBudgetRecommendations, 
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 1. Create or update budget
router.post('/', protect, createBudget); 

// 2. Get all budgets for user
router.get('/', protect, getUserBudgets);

// 3. Get budget recommendations
router.get('/recommendations', protect, getBudgetRecommendations); 

// 4. Get budget by category
router.get('/category/:category', protect, getBudgetByCategory);

// 5. Delete budget by category
router.delete('/category/:category', protect, deleteBudgetByCategory);

// 6. Update budget by ID
router.put('/:id', protect, updateBudget);

module.exports = router;
