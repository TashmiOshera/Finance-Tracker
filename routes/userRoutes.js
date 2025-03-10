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
const { protect } = require('../middleware/auth'); 
const admin = require('../middleware/admin'); 

const router = express.Router();

// Public Routes
router.post('/register', registerUser); 
router.post('/login', loginUser); 

// Protected Routes
router.get('/profile', protect, getProfile); 

// Admin-only Routes
router.get('/admin/users', protect, admin, getAllUsers); 
router.get('/admin/users/:id', protect, admin, getUserById); 
router.put('/admin/users/:id', protect, admin, updateUser); 
router.delete('/admin/users/:id', protect, admin, deleteUser); 

module.exports = router;
