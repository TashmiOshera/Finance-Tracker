const express = require('express');
const {
  createBudget,
  getUserBudgets,
  deleteBudgetByCategory,
  updateBudget,
  getBudgetByCategory,
  getBudgetRecommendations, // Added budget recommendation function
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createBudget); // Create or update budget
router.get('/', protect, getUserBudgets); // Get all budgets for user
router.get('/recommendations', protect, getBudgetRecommendations); // ✅ Added budget recommendations route
router.get('/category/:category', protect, getBudgetByCategory);
router.delete('/category/:category', protect, deleteBudgetByCategory);
router.put('/:id', protect, updateBudget); // Update budget

module.exports = router;
