

const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Goal = require("../models/Goal");
const axios = require("axios");
const Savings = require("../models/Savings.js");
const { SendEmail } = require("../utils/emailService.js"); // Use destructuring
const { getExchangeRate } = require("../utils/currencyConverter.js");

const addTransaction = async (req, res) => {
  const {
    type,
    category,
    amount,
    transactionCurrency,
    date,
    note,
    tags,
    isRecurring,
    recurrence,
  } = req.body;

  if (!type || !category || !amount || !transactionCurrency) {
    return res.status(400).json({
      message: "Type, category, amount, and transactionCurrency are required.",
    });
  }

  try {
    // Get exchange rate for currency conversion
    const exchangeRate = await getExchangeRate(transactionCurrency);
    const convertedAmount = amount * exchangeRate;

    // Ensure recurrence is handled correctly
    const recurrencePattern = isRecurring ? recurrence : null;

    // Create the transaction
    const transaction = new Transaction({
      userId: req.user.id,
      type,
      category,
      amount,
      transactionCurrency,
      exchangeRate,
      convertedAmount,
      date: date ? new Date(date) : new Date(),
      note,
      tags,
      isRecurring,
      recurrence: recurrencePattern,
    });

    await transaction.save();

    // Handle Savings
    let savingsAmount = 0;
    if (type === "income") {
      savingsAmount = amount * 0.2; // 20% Allocation
      const savings = new Savings({
        userId: req.user.id,
        amount: savingsAmount,
      });
      await savings.save();
    }

    // Calculate total savings
    const totalSavings = await Savings.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);

    const totalSavingsAmount =
      totalSavings.length > 0 ? totalSavings[0].totalAmount : 0;
    const remainingBalance = amount - savingsAmount;

    // Send Email Notification for the transaction
    const user = await User.findById(req.user.id);
    if (user && user.email) {
      await SendEmail(
        user.email,
        "💰 Transaction Update - Currency Conversion Included",
        `Dear ${user.name},

Your recent transaction has been successfully recorded.

🔹 *Amount:* ${amount} ${transactionCurrency}
🔹 *Exchange Rate:* ${exchangeRate}
🔹 *Converted Amount (LKR):* ${convertedAmount.toLocaleString()}

We've successfully allocated *LKR ${savingsAmount.toLocaleString()}* from your income to savings.
        
🔹 *New Savings Allocation:* LKR ${savingsAmount.toLocaleString()}
🔹 *Remaining Balance:* LKR ${remainingBalance.toLocaleString()}

Recurring income allocation has been scheduled if applicable.

Best regards,  
*Your Finance Tracker Team*`
      );
    }

    if (type === "expense") {
      const budget = await Budget.findOne({ userId: req.user.id, category });
      if (budget) {
        const newTotalSpent = (budget.totalSpent || 0) + amount;
        budget.totalSpent = newTotalSpent;
        budget.balance = budget.limit - newTotalSpent;
        await budget.save();

        if (newTotalSpent > budget.limit) {
          const balanceAfterSpending = budget.limit - newTotalSpent;

          // Create and save the notification for the user
          const notificationMessage = `Warning!!! ${user.name}, you exceeded your ${category} budget! Limit: LKR ${budget.limit}, Spent: LKR ${newTotalSpent}, Balance: LKR ${balanceAfterSpending}`;
          const notification = new Notification({
            userId: req.user.id,
            category,
            message: notificationMessage,
            limit: budget.limit,
            totalSpent: newTotalSpent,
            balanceAfterSpending,
          });
          await notification.save();

          // Send email notification
          if (user && user.email) {
            await SendEmail(
              user.email,
              "⚠️ Budget Alert - Spending Limit Exceeded",
              `Dear ${user.name},

You have exceeded your budget for the category '${category}'.

💰 Budget Limit: LKR ${budget.limit}
🛒 Total Spent: LKR ${newTotalSpent}
💸 Remaining Balance: LKR ${balanceAfterSpending}

Please review your spending and consider adjusting your budget.

Best regards,  
*Your Finance Tracker Team*`
            );
          }
        }
      }
    }

    res.status(201).json({
      message: "Transaction added successfully",
      transaction: {
        ...transaction.toObject(),
        formattedAmount: `${transactionCurrency} ${amount.toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("❌ Error adding transaction:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { addTransaction };


// Edit a transaction
const editTransaction = async (req, res) => {
  const { type, category, amount, date, note, tags, recurrence } = req.body;

  if (!type || !category || !amount) {
    return res
      .status(400)
      .json({ message: "Type, category, and amount are required." });
  }

  try {
    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.user.id };
    const transaction = await Transaction.findOneAndUpdate(
      filter,
      { type, category, amount, date, note, tags, recurrence },
      { new: true }
    );

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction not found or unauthorized." });
    }

    res
      .status(200)
      .json({ message: "Transaction updated successfully", transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.user.id };
    const transaction = await Transaction.findOneAndDelete(filter);

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction not found or unauthorized." });
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
    const filter =
      req.user.role === "admin"
        ? { _id: req.params.id }
        : { _id: req.params.id, userId: req.user.id };
    const transaction = await Transaction.findOne(filter);

    if (!transaction) {
      return res
        .status(404)
        .json({ message: "Transaction not found or unauthorized." });
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
    return res
      .status(500)
      .json({ message: "Server Error", error: error.message });
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
