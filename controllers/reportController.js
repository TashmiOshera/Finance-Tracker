const Transaction = require('../models/Transaction');

//  Get financial report

const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, category, tags } = req.query; // Extracting filters from request
    const userId = req.user._id; // Authenticated user ID

    // Initialize filter object
    const filter = { userId };

    // Apply date range filter if provided
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Apply category filter if provided
    if (category) {
      filter.category = category;
    }

    // Apply tags filter if provided (assuming tags are stored as an array in the DB)
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Fetch filtered transactions
    const transactions = await Transaction.find(filter);

    // Initialize summary variables
    let totalIncome = 0;
    let totalExpense = 0;
    const categorySummary = {};

    transactions.forEach((txn) => {
      // Initialize category if not present
      if (!categorySummary[txn.category]) {
        categorySummary[txn.category] = { income: 0, expense: 0 };
      }

      // Categorize transactions
      if (txn.type === 'income') {
        categorySummary[txn.category].income += txn.amount;
        totalIncome += txn.amount;
      } else {
        categorySummary[txn.category].expense += txn.amount;
        totalExpense += txn.amount;
      }
    });

    // Send response
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
