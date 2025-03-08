const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction'); 
const { checkUnusualSpending } = require("../controllers/notificationController"); 


// @desc    Create a budget only if it doesn't exist
// @route   POST /api/budgets
// @access  Private (Only logged-in users)




const createBudget = async (req, res) => {
  try {
    const { category, limit, period } = req.body;

    // Check if required fields are provided
    if (!category || !limit) {
      return res.status(400).json({
        success: false,
        message: "Category and limit are required.",
      });
    }

    // Ensure the category is valid
    const validCategories = [
      "Food",
      "Transportation",
      "Entertainment",
      "Bills",
      "Shopping",
      "Salary",
      "Rent",
      "Healthcare",
      "Investment",
      "Others"
    ];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Choose from the predefined categories.",
      });
    }

    // Check if the user already has a budget for this category
    const existingBudget = await Budget.findOne({ userId: req.user.id, category });
    if (existingBudget) {
      return res.status(400).json({
        success: false,
        message: `You already have a budget set for ${category}. Update or delete it first.`,
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

// @desc    Get all budgets for the logged-in user
// @route   GET /api/budgets
// @access  Private
const getUserBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id });
    res.status(200).json(budgets);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update an existing budget
// @route   PUT /api/budgets/:id
// @access  Private


const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, limit, month, year, totalSpent } = req.body; // Include totalSpent
    const userId = req.user._id;

    // Find the budget by ID and user
    const budget = await Budget.findOne({ _id: id, userId });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found or unauthorized access" });
    }

    // Ensure the category remains the same
    if (category && category !== budget.category) {
      return res.status(400).json({ message: "Category cannot be changed" });
    }

    // Validate limit and totalSpent to be positive numbers
    if (limit < 0 || totalSpent < 0) {
      return res.status(400).json({ message: "Limit and totalSpent must be positive numbers" });
    }

    // Update allowed fields
    budget.limit = limit !== undefined ? limit : budget.limit;
    budget.month = month !== undefined ? month : budget.month;
    budget.year = year !== undefined ? year : budget.year;

    // If totalSpent is provided, update it
    if (totalSpent !== undefined) {
      budget.totalSpent = totalSpent;
    }

    // Recalculate balance after updates
    budget.balance = budget.limit - budget.totalSpent;

    // Call the checkUnusualSpending function after updating totalSpent
    await checkUnusualSpending(userId, budget.category, budget.totalSpent);

    // Save the updated budget
    await budget.save();
    
    // Send a successful response with the updated budget
    res.status(200).json({ message: "Budget updated successfully", budget });
  } catch (error) {
    console.error("Error updating budget:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getBudgetRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const budgets = await Budget.find({ userId });
    const transactions = await Transaction.find({ userId });

    if (!budgets.length) {
      return res.status(404).json({ message: "No budgets found." });
    }

    let recommendations = [];

    budgets.forEach((budget) => {
      // Filter transactions related to this budget category
      const relatedTransactions = transactions.filter(
        (tx) => tx.category === budget.category && tx.type === "expense"
      );

      // Calculate total spent in the current period
      const totalSpent = relatedTransactions.reduce(
        (sum, tx) => sum + tx.amount,
        0
      );

      const spendingRate = (totalSpent / budget.limit) * 100;

      let recommendation = {
        category: budget.category,
        currentSpending: totalSpent,
        budgetLimit: budget.limit,
        balance: budget.limit - totalSpent,
        recommendation: "Your spending is within budget. Keep it up!",
      };

      if (spendingRate > 100) {
        recommendation.recommendation =
          "You have exceeded your budget. Consider reducing expenses in this category.";
      } else if (spendingRate > 80) {
        recommendation.recommendation =
          "You are close to exceeding your budget. Try monitoring your expenses carefully.";
      } else if (spendingRate < 50) {
        recommendation.recommendation =
          "You are spending much less than your budget. Consider adjusting it to better allocate funds.";
      }

      recommendations.push(recommendation);
    });

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const deleteBudgetByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user._id;

    // Find and delete the budget for the user in the given category
    const deletedBudget = await Budget.findOneAndDelete({ userId, category });

    if (!deletedBudget) {
      return res.status(404).json({ message: "Budget not found for the given category" });
    }

    res.status(200).json({ message: "Budget deleted successfully", deletedBudget });
  } catch (error) {
    console.error("Error deleting budget:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const getBudgetByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user._id;

    // Find the budget for the user in the given category
    const budget = await Budget.findOne({ userId, category });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found for the given category" });
    }

    res.status(200).json({ budget });
  } catch (error) {
    console.error("Error fetching budget:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




module.exports = { createBudget, getUserBudgets, updateBudget, deleteBudgetByCategory,getBudgetByCategory,getBudgetRecommendations};
