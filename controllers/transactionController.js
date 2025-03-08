const Transaction = require('../models/Transaction'); 
const Budget = require('../models/Budget'); 
const User = require('../models/User'); 
const Notification = require('../models/Notification'); 
const Goal = require('../models/Goal');



// Function to convert currency using an external API (e.g., ExchangeRate API)
const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    const API_KEY = 'f0c2f100eeff2a348e2118fc'; // Replace with your actual API key
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${fromCurrency}`;
    
    const response = await axios.get(url);
    const exchangeRate = response.data.rates[toCurrency];

    if (!exchangeRate) {
      throw new Error(`Exchange rate for ${toCurrency} not found.`);
    }

    return amount * exchangeRate;
  } catch (error) {
    console.error("Currency conversion error:", error.message);
    throw new Error("Failed to fetch exchange rates.");
  }
};


// Add a new transaction (Regular User)
const addTransaction = async (req, res) => {
  const { type, category, amount, date, note, tags, recurrence } = req.body;

  if (!type || !category || !amount) {
    return res.status(400).json({ message: "Type, category, and amount are required." });
  }

  try {
    // Create the transaction
    const transaction = new Transaction({
      userId: req.user.id,
      type,
      category,
      amount,
      date: date ? new Date(date) : new Date(),
      note,
      tags,
      recurrence,
    });

    await transaction.save();

    // If it's an income transaction, allocate a portion to savings automatically
    if (type === "income") {
      await allocateSavings(req.user.id, amount);
    }

    res.status(201).json({ message: "Transaction added successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const allocateSavings = async (userId, incomeAmount) => {
  try {
    const savingsPercentage = 0.10; // Allocate 10% of income to savings
    const savingsAmount = incomeAmount * savingsPercentage;

    // Find user's active savings goals
    const goals = await Goal.find({ userId });

    if (goals.length === 0) {
      console.log("No savings goals found for user.");
      return; // No goals available to allocate savings
    }

    const allocationPerGoal = savingsAmount / goals.length;

    for (let goal of goals) {
      goal.currentAmount += allocationPerGoal;
      await goal.save();
    }

    // Create a savings transaction entry
    const savingsTransaction = new Transaction({
      userId,
      type: "expense", // Treat savings as an expense to track
      category: "Savings",
      amount: savingsAmount,
      date: new Date(),
      note: "Automated savings allocation",
    });

    await savingsTransaction.save();

    // Send a notification to the user
    const notification = new Notification({
      userId,
      message: `An amount of $${savingsAmount.toFixed(2)} has been automatically allocated to your savings goals.`,
    });

    await notification.save();

    console.log("Savings allocated successfully.");
  } catch (error) {
    console.error("Error allocating savings:", error.message);
  }
};

// Edit a transaction
const editTransaction = async (req, res) => {
  const { type, category, amount, date, note, tags, recurrence } = req.body;

  if (!type || !category || !amount) {
    return res.status(400).json({ message: "Type, category, and amount are required." });
  }

  try {
    const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const transaction = await Transaction.findOneAndUpdate(
      filter,
      { type, category, amount, date, note, tags, recurrence },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found or unauthorized." });
    }

    res.status(200).json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const transaction = await Transaction.findOneAndDelete(filter);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found or unauthorized." });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const { category, tags } = req.query;
    let filter = req.user.role === "admin" ? {} : { userId: req.user.id };

    if (category) {
      filter.category = category;
    }

    if (tags) {
      filter.tags = { $in: tags.split(",").map((tag) => tag.trim()) };
    }

    const transactions = await Transaction.find(filter);

    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions found." });
    }

    res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single transaction
const getTransactionById = async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? { _id: req.params.id } : { _id: req.params.id, userId: req.user.id };
    const transaction = await Transaction.findOne(filter);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found or unauthorized." });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get transactions by tag
const getTransactionsByTag = async (req, res) => {
  try {
    const { tags } = req.params;

    if (!tags) {
      return res.status(400).json({ message: "Tags parameter is required." });
    }

    const tagsArray = tags.split(",");

    const transactions = await Transaction.find({
      tags: { $in: tagsArray },
    });

    return res.status(200).json({ transactions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get financial report for all transactions (Admin Only)
const getAdminFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const transactions = await Transaction.find(filter);

    if (!transactions.length) {
      return res.status(404).json({ message: "No transactions found." });
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = {};

    transactions.forEach((tx) => {
      if (tx.type === "income") {
        totalIncome += tx.amount;
      } else if (tx.type === "expense") {
        totalExpenses += tx.amount;
      }

      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = 0;
      }
      categoryTotals[tx.category] += tx.amount;
    });

    res.status(200).json({
      totalIncome,
      totalExpenses,
      categoryTotals,
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addTransaction,
  editTransaction,
  deleteTransaction,
  getAllTransactions,
  getTransactionById,
  getAdminFinancialReport,
  getTransactionsByTag,
  
};
