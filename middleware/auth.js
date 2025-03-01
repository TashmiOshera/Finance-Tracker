const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect route
const protect = async (req, res, next) => {
  try {
    let token;

    // Check if token is provided in the authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token is found
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultSecret');

    // Fetch the user associated with the token
    req.user = await User.findById(decoded.id).select('-password'); // Exclude password

    // If the user is not found
    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Allow the request to proceed to the next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired, please log in again' });
    }
    res.status(401).json({ message: 'Not authorized', error: error.message });
  }
};

module.exports = { protect };
