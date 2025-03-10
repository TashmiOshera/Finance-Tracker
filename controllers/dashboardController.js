const User = require('../models/User');
const Transaction = require('../models/Transaction'); 
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const Budget = require('../models/Budget'); // Import the Budget model

// Get dashboard data based on user role
const getDashboardData = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Fetch all users and system-wide transaction data
      const totalUsers = await User.countDocuments();
      const totalTransactions = await Transaction.countDocuments();
      const totalAmount = await Transaction.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]);


      // Fetch admin notifications
      const adminNotifications = await Notification.find({ recipientRole: 'admin' });

      return res.json({
        role: 'admin',
        totalUsers,
        totalTransactions,
        totalAmount: totalAmount.length ? totalAmount[0].total : 0,
        notifications: adminNotifications, // Add notifications for admin
      });

    } else {
      // only the logged-in user's transaction summary
      const userTransactions = await Transaction.find({ userId: req.user.id });
      const totalSpent = userTransactions.reduce((acc, t) => acc + t.amount, 0);

      // user-specific financial goals
      const userGoals = await Goal.find({ userId: req.user.id });

      // user-specific budgets
      const userBudgets = await Budget.find({ userId: req.user.id });

      // user-specific notifications
      const userNotifications = await Notification.find({ userId: req.user.id });

      return res.json({
        role: 'user',
        totalTransactions: userTransactions.length,
        totalSpent,
        goals: userGoals, 
        budgets: userBudgets, 
        notifications: userNotifications, 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

module.exports = { getDashboardData };
