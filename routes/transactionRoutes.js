const express = require('express');
const { protect } = require('../middleware/auth'); 
const adminOnly = require('../middleware/admin'); 
const transactionController = require('../controllers/transactionController');

const router = express.Router();

// Admin  Oversee all transactions (Must be placed before '/:id')
router.get('/all', protect, adminOnly, transactionController.getAllTransactions);
// Admin  Generate Financial Reports
router.get('/reports', protect, adminOnly, transactionController.getAdminFinancialReport); 

// Regular User Routes
router.post('/', protect, transactionController.addTransaction); 
router.put('/:id', protect, transactionController.editTransaction); 
router.delete('/:id', protect, transactionController.deleteTransaction); 
router.get('/', protect, transactionController.getAllTransactions); 
router.get('/:id', protect, transactionController.getTransactionById); 
router.get('/tags/:tags', protect, transactionController.getTransactionsByTag); 

module.exports = router;
