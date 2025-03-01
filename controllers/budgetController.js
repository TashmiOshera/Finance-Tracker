const Budget = require('../models/Budget');

// @desc    Create a budget only if it doesn't exist
// @route   POST /api/budgets
// @access  Private (Only logged-in users)
const createBudget = async (req, res) => {
  try {
    const { category, limit, period } = req.body;

    // Check if required fields are provided
    if (!category || !limit||!period) {
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
    const { category, limit, month, year } = req.body;
    const userId = req.user._id;

    // Find and update the budget (ensuring it's the same category)
    const budget = await Budget.findOneAndUpdate(
      { _id: id, userId },
      { limit, month, year },
      { new: true, runValidators: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found or unauthorized access' });
    }

    res.status(200).json({ message: 'Budget updated successfully', budget });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudgetByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const userId = req.user._id; // Get the logged-in user's ID

    const budget = await Budget.findOne({ userId, category });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found for this category' });
    }

    await budget.deleteOne();
    res.status(200).json({ message: 'Budget deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get budget for a specific category
const getBudgetByCategory = async (req, res) => {
  try {
    const userId = req.user.id; // Get user ID from authentication
    const category = req.params.category; // Get category from request parameters

    // Find the budget for the user and given category
    const budget = await Budget.findOne({ userId, category });

    if (!budget) {
      return res.status(404).json({ success: false, message: `No budget found for category: ${category}` });
    }

    res.status(200).json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching budget", error: error.message });
  }
};


module.exports = { createBudget, getUserBudgets, updateBudget, deleteBudgetByCategory,getBudgetByCategory};
