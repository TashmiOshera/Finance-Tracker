// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Middleware to protect routes
const notificationController = require('../controllers/notificationController'); // Notification controller

// Regular User Route - Get all notifications for the authenticated user
router.get('/', protect, notificationController.getNotifications);

module.exports = router;
