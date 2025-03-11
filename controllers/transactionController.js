

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
  try {
    const {
      amount,
      currency,
      type,
      category,
      tags,
      recurring,
      recurrencePattern,
      date,
    } = req.body;

    // ✅ Validate required fields
    if (!amount || !currency || !type || !category) {
      return res.status(400).json({
        success: false,
        message: "Amount, currency, type, and category are required.",
      });
    }

    const userId = req.user.id;

    
    

    // ✅ Fetch exchange rate and convert amount
    const exchangeRate = await getExchangeRate(currency);
    const convertedAmount = amount * exchangeRate;

    // ✅ Create new transaction
    const transaction = new Transaction({
      userId,
      amount,
      currency,
      exchangeRate,
      convertedAmount,
      type,
      category,
      tags,
      recurring,
      recurrencePattern,
      date: date || new Date(),
    });

    await transaction.save();

    let savingsAmount = 0;

    // ✅ If transaction is income, allocate 20% to savings
    if (type === "income") {
      savingsAmount = amount * 0.2; // 20% Allocation
      const savings = new Savings({
        userId,
        amount: savingsAmount,
      });
      await savings.save();
    }

    // ✅ Calculate total savings
    const totalSavings = await Savings.aggregate([
      { $match: { userId } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
    ]);
    const totalSavingsAmount =
      totalSavings.length > 0 ? totalSavings[0].totalAmount : 0;
    const remainingBalance = amount - savingsAmount;

    // ✅ Fetch user details
    const user = await User.findById(userId);
    if (!user || !user.email) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // 📧 **Send Transaction Confirmation Email**
    await SendEmail(
      user.email,
      "💰 Transaction Update - Currency Conversion Included",
      `Dear ${user.name},

Your recent transaction has been successfully recorded.

🔹 *Amount:* ${amount} ${currency}
🔹 *Exchange Rate:* ${exchangeRate}
🔹 *Converted Amount (LKR):* ${convertedAmount.toLocaleString()}

Best regards,  
*Your Finance Tracker Team*`
    );

    // 📧 **Send Savings Allocation Email (if income)**
    if (type === "income") {
      await SendEmail(
        user.email,
        "💰 Savings Allocation Update",
        `Dear ${user.name},

We've successfully allocated *LKR ${savingsAmount.toLocaleString()}* from your income to savings.

🔹 *New Savings Allocation:* LKR ${savingsAmount.toLocaleString()}  
🔹 *Remaining Balance:* LKR ${remainingBalance.toLocaleString()}  

Recurring income allocation has been scheduled if applicable.

Best regards,  
*Your Finance Tracker Team*`
      );
    }

    // ✅ Handle Recurring Transactions
    if (recurring) {
      scheduleRecurringTransaction(transaction, userId);
    }

    // ✅ Handle Expenses & Budget Limit Check
    if (type === "expense") {
      const budget = await Budget.findOne({ userId, category });

      if (budget) {
        const newTotalSpent = (budget.totalSpent || 0) + amount;
        budget.totalSpent = newTotalSpent;
        budget.balance = budget.limit - newTotalSpent;
        await budget.save();

        // ✅ If budget exceeded, send email and notification
        if (newTotalSpent > budget.limit) {
          const balanceAfterSpending = budget.limit - newTotalSpent;

          const notificationMessage = `⚠️ Warning! ${user.name}, you exceeded your ${category} budget!  
🔹 Budget Limit: LKR ${budget.limit}  
🔹 Total Spent: LKR ${newTotalSpent}  
🔹 Remaining Balance: LKR ${balanceAfterSpending}`;

const notification = new Notification({
  userId,
  category,
  message: notificationMessage,
  limit: budget.limit,
  totalSpent: newTotalSpent,
  balanceAfterSpending,
});
await notification.save();

          // 📧 **Send Budget Exceed Email**
          await SendEmail(
            user.email,
            "⚠ Budget Limit Exceeded - Immediate Attention Required!",
            `Dear ${user.name},  
          
We hope you're doing well.  

This is a friendly reminder that you have exceeded your budget for *${category}*.  
Here’s a quick summary of your spending:  

🔸 *Budget Limit:* LKR ${budget.limit}  
🔸 *Total Spent:* LKR ${newTotalSpent}  
🔸 *Remaining Balance:* LKR ${balanceAfterSpending}  

We recommend reviewing your expenses and making adjustments where necessary to stay on track with your financial goals.  

If you need assistance managing your budget, we're here to help!  

Best regards,  
*Your Finance Tracker Team*`
          );
        }
      }
    }

    // ✅ Final response
    res.status(201).json({
      success: true,
      message: "Transaction added successfully!",
      transaction,
    });
  } catch (error) {
    console.error("❌ Error adding transaction:", error);
    res.status(500).json({
      success: false,
      message: "Error adding transaction",
      error: error.message,
    });
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
    // Ensure only admins can access this report
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const { startDate, endDate } = req.query;
    let filter = {};

    // Apply date range filter if provided
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Fetch all transactions with user details
    const transactions = await Transaction.find(filter).populate("userId", "name email");

    // Fetch all users (in case some users have no transactions)
    const users = await User.find({}, "name email");

    if (!transactions.length && !users.length) {
      return res.status(404).json({ message: "No users or transactions found." });
    }

    let totalIncome = 0;
    let totalExpenses = 0;
    const userReports = {};

    // Initialize reports for all users
    users.forEach((user) => {
      userReports[user._id] = {
        userId: user._id,
        name: user.name,
        email: user.email,
        totalIncome: 0,
        totalExpenses: 0,
        categoryTotals: {},
        transactions: [],
      };
    });

    // Process transactions
    transactions.forEach((tx) => {
      const user = tx.userId;

      // If transaction has no user (edge case), skip
      if (!user) return;

      // Ensure user is in the report
      if (!userReports[user._id]) {
        userReports[user._id] = {
          userId: user._id,
          name: user.name,
          email: user.email,
          totalIncome: 0,
          totalExpenses: 0,
          categoryTotals: {},
          transactions: [],
        };
      }

      // Update total income & expenses
      if (tx.type === "income") {
        userReports[user._id].totalIncome += tx.amount;
        totalIncome += tx.amount;
      } else if (tx.type === "expense") {
        userReports[user._id].totalExpenses += tx.amount;
        totalExpenses += tx.amount;
      }

      // Update category-wise totals
      if (!userReports[user._id].categoryTotals[tx.category]) {
        userReports[user._id].categoryTotals[tx.category] = 0;
      }
      userReports[user._id].categoryTotals[tx.category] += tx.amount;

      // Store transaction details
      userReports[user._id].transactions.push(tx);
    });

    res.status(200).json({
      totalIncome,
      totalExpenses,
      users: Object.values(userReports), // Convert object to array
    });
  } catch (error) {
    console.error("❌ Error fetching admin financial report:", error.message);
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
