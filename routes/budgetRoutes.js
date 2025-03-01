const express = require('express');
const {
  createBudget,
  getUserBudgets,
  deleteBudgetByCategory,
  updateBudget,
 getBudgetByCategory
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createBudget); // Create or update budget
router.get('/', protect, getUserBudgets); // Get all budgets for user
router.delete('/category/:category', protect, deleteBudgetByCategory);
router.get('/category/:category', protect, getBudgetByCategory);

router.put('/:id', protect, updateBudget); // ✅ Add this line for updating budgets

module.exports = router;
