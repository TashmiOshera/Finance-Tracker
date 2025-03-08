const Goal = require('../models/Goal');
const { checkGoalDeadlines } = require("../controllers/notificationController");

// ✅ Add a financial goal with validation
const addGoal = async (req, res) => {
  console.log(req.body);  // Log the request body to check if the fields are present

  const { name, targetAmount, deadline, currentAmount } = req.body;

  if (!name || !targetAmount || !deadline) {
    return res.status(400).json({ message: "Name, target amount, and deadline are required." });
  }

  try {
    // Ensure deadline is a valid future date
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate) || deadlineDate < new Date()) {
      return res.status(400).json({ message: "Invalid deadline. Please provide a future date." });
    }

    // Create and save goal
    const goal = new Goal({
      userId: req.user._id,
      name,
      targetAmount,
      deadline: deadlineDate,
      currentAmount: currentAmount || 0,
    });

    await goal.save();

    // Check goal deadlines safely
    try {
      await checkGoalDeadlines(req.user._id);
    } catch (err) {
      console.error("⚠️ Failed to check goal deadlines:", err.message);
    }

    // Send success response
    res.status(201).json({ message: "Financial goal added successfully", goal });
  } catch (error) {
    console.error("❌ Error adding goal:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// ✅ Get all financial goals for the authenticated user
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });

    // ✅ Prevent division by zero in progress calculation
    const goalsWithProgress = goals.map(goal => ({
      ...goal._doc, // Spread goal data
      progress: goal.targetAmount > 0 
        ? Math.min(((goal.currentAmount / goal.targetAmount) * 100).toFixed(2), 100) // Ensure max 100%
        : 0
    }));

    res.status(200).json({ goals: goalsWithProgress });
  } catch (error) {
    console.error("❌ Error fetching goals:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { addGoal, getGoals };
