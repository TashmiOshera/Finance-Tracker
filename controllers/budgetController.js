const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// check for budget notifications
const checkBudgetNotifications = (limit, totalSpent) => {
  let message = '';
  const spendingRate = (totalSpent / limit) * 100;

  if (spendingRate > 100) {
    message = "You have exceeded your budget. Consider reducing expenses in this category.";
  } else if (spendingRate > 80) {
    message = "You are close to exceeding your budget. Monitor your spending carefully.";
  } else if (spendingRate < 50) {
    message = "You're spending much less than your budget. You could consider reallocating some of this budget.";
  }

  return message;
};


// Create Budget
const createBudget = async (req, res) => {
  try {
    const { category, limit, period } = req.body;

    if (!category || !limit || !period) {
      return res.status(400).json({
        success: false,
        message: "Category, limit, and period are required.",
      });
    }

    const validCategories = [
      "Food", "Transportation", "Entertainment", "Bills", "Shopping",
      "Salary", "Rent", "Healthcare", "Investment", "Others",
      "Utilities", "Education", "Groceries", "Travel", "Gifts",
      "Savings", "Emergency Fund", "Insurance", "Subscriptions", "Pet Care",
      "Childcare", "Personal Care", "Home Improvement", "Debt Repayment", 
      "Charity", "Books", "Hobbies", "Fitness", "Events"
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Choose from the predefined categories.",
      });
    }

    const existingBudget = await Budget.findOne({ userId: req.user.id, category, period });
    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${period} budget set for ${category}. Update or delete it first.`,
      });
    }

    const budget = new Budget({
      userId: req.user.id,
      category,
      limit,
      period,
    });

    await budget.save();
    res.status(201).json({ success: true, message: "Budget set successfully!", budget });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error setting budget",
      error: error.message,
    });
  }
};



//  Get User's Budgets
const getUserBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    
    if (!budgets || budgets.length === 0) {
      return res.status(404).json({ success: false, message: "No budgets found." });
    }

    res.status(200).json({ success: true, budgets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching budgets", error: error.message });
  }
};



// Update Budget
const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, limit, totalSpent } = req.body;
    const userId = req.user.id;

    const budget = await Budget.findOne({ _id: id, userId });

    if (!budget) {
      return res.status(404).json({ success: false, message: "Budget not found or unauthorized access" });
    }

    if (category && category !== budget.category) {
      return res.status(400).json({ success: false, message: "Category cannot be changed" });
    }




    // Update allowed fields
    budget.limit = limit !== undefined ? limit : budget.limit;
    budget.totalSpent = totalSpent !== undefined ? totalSpent : budget.totalSpent;

    // Recalculate balance
    budget.balance = budget.limit - budget.totalSpent;

    // Check for notifications
    const notificationMessage = checkBudgetNotifications(budget.limit, budget.totalSpent);

    // Optionally, send this notification via email or other channels
    console.log(`Notification for User ${userId}: ${notificationMessage}`);

    await budget.save();
    res.status(200).json({ success: true, message: "Budget updated successfully", budget, notification: notificationMessage });
  } catch (error) {
    console.error("Error updating budget:", error.message);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



// Delete Budget by Category
const deleteBudgetByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user.id;

    const budget = await Budget.findOneAndDelete({ userId, category });

    if (!budget) {
      return res.status(404).json({ success: false, message: `No budget found for category: ${category}` });
    }

    res.status(200).json({ success: true, message: `Budget for category ${category} deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting budget", error: error.message });
  }
};


// Get Budget by Category
const getBudgetByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user.id;

    const budget = await Budget.findOne({ userId, category });

    if (!budget) {
      return res.status(404).json({ success: false, message: `No budget found for category: ${category}` });
    }

    res.status(200).json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching budget", error: error.message });
  }
};



// Get Budget Recommendations
const getBudgetRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await Budget.find({ userId });
    const transactions = await Transaction.find({ userId });

    if (!budgets.length) {
      return res.status(404).json({ success: false, message: "No budgets found." });
    }

    let recommendations = [];

    budgets.forEach((budget) => {
      const relatedTransactions = transactions.filter(tx => tx.category === budget.category && tx.type === "expense");

      const totalSpent = relatedTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const spendingRate = (totalSpent / budget.limit) * 100;

      let recommendation = {
        category: budget.category,
        currentSpending: totalSpent,
        budgetLimit: budget.limit,
        balance: budget.limit - totalSpent,
        recommendation: "Your spending is within budget. Keep it up!",
      };

      if (spendingRate > 100) {
        recommendation.recommendation = "You have exceeded your budget. Consider reducing expenses in this category.";
      } else if (spendingRate > 80) {
        recommendation.recommendation = "You are close to exceeding your budget. Try monitoring your expenses carefully.";
      } else if (spendingRate < 50) {
        recommendation.recommendation = "You are spending much less than your budget. Consider adjusting it to better allocate funds.";
      }

      recommendations.push(recommendation);
    });

    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = {
  createBudget,
  getUserBudgets,
  updateBudget,
  deleteBudgetByCategory,
  getBudgetByCategory,
  getBudgetRecommendations,
};
