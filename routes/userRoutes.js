const express = require('express');
const { 
  registerUser, 
  loginUser, 
  getProfile, 
  getAllUsers, 
  getUserById, 
  updateUser, 
  deleteUser 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth'); // Import protect middleware
const admin = require('../middleware/admin'); // Import admin middleware

const router = express.Router();

// Public Routes
router.post('/register', registerUser); 
router.post('/login', loginUser); 

// Protected Routes
router.get('/profile', protect, getProfile); 

// Admin-only Routes
router.get('/admin/users', protect, admin, getAllUsers); // Only accessible by admin
router.get('/admin/users/:id', protect, admin, getUserById); // Only accessible by admin
router.put('/admin/users/:id', protect, admin, updateUser); // Only accessible by admin
router.delete('/admin/users/:id', protect, admin, deleteUser); // Only accessible by admin

module.exports = router;
