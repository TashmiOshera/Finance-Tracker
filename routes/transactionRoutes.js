const express = require('express');
const { protect } = require('../middleware/auth'); // User authentication
const adminOnly = require('../middleware/admin'); // Admin authorization
const transactionController = require('../controllers/transactionController');

const router = express.Router();

// Admin Route - Oversee all transactions (Must be placed before '/:id')
router.get('/all', protect, adminOnly, transactionController.getAllTransactions);
// Admin Route - Generate Financial Reports
router.get('/reports', protect, adminOnly, transactionController.getAdminFinancialReport); // FIXED

// Regular User Routes
router.post('/', protect, transactionController.addTransaction); // Add transaction
router.put('/:id', protect, transactionController.editTransaction); // Edit transaction
router.delete('/:id', protect, transactionController.deleteTransaction); // Delete transaction
router.get('/', protect, transactionController.getAllTransactions); // Get user transactions (filter by category)
router.get('/:id', protect, transactionController.getTransactionById); // Get single transaction
router.get('/tags/:tags', protect, transactionController.getTransactionsByTag); // Get transactions by tag
router.get('/savings', protect, transactionController.allocateSavings)


module.exports = router;
