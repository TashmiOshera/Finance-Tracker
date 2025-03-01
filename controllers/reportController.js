const Transaction = require('../models/Transaction');

// @desc Get financial report
// @route GET /api/reports
// @access Private (Regular users)
const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query; // Date filters from request
    const userId = req.user._id; // Authenticated user

    const filter = { userId };
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fetch transactions
    const transactions = await Transaction.find(filter);

    // Categorize income & expenses
    let totalIncome = 0;
    let totalExpense = 0;
    const categorySummary = {};

    transactions.forEach((txn) => {
      if (!categorySummary[txn.category]) {
        categorySummary[txn.category] = { income: 0, expense: 0 };
      }
      if (txn.type === 'income') {
        categorySummary[txn.category].income += txn.amount;
        totalIncome += txn.amount;
      } else {
        categorySummary[txn.category].expense += txn.amount;
        totalExpense += txn.amount;
      }
    });

    res.status(200).json({
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      categoryBreakdown: categorySummary,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getFinancialReport };
