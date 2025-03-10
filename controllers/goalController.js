const Goal = require('../models/Goal');
const { checkGoalDeadlines } = require("../controllers/notificationController");




// calculate progress percentage
const calculateProgress = (currentAmount, targetAmount) => {
  if (targetAmount <= 0) return 0;  
  const progress = (currentAmount / targetAmount) * 100;
  return Math.min(progress, 100);  
};


// Add a financial goal 
const addGoal = async (req, res) => {
  console.log(req.body);  

  const { name, targetAmount, deadline, currentAmount } = req.body;

  if (!name || !targetAmount || !deadline) {
    return res.status(400).json({ message: "Name, target amount, and deadline are required." });
  }

  try {
    //  deadline is a valid future date
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
      const progress = calculateProgress(goal.currentAmount, goal.targetAmount);

      res.status(201).json({
        message: "Financial goal added successfully",
        goal,
        progress
      });
    } catch (error) {
      console.error("❌ Error adding goal:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };


//  Get all financial goals for the authenticated user
const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });

    //  Prevent division by zero in progress calculation
    const goalsWithProgress = goals.map(goal => ({
      ...goal._doc, 
      progress: goal.targetAmount > 0 
        ? Math.min(((goal.currentAmount / goal.targetAmount) * 100).toFixed(2), 100) 
        : 0
    }));

    res.status(200).json({ goals: goalsWithProgress });
  } catch (error) {
    console.error("❌ Error fetching goals:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a goal by ID
const updateGoal = async (req, res) => {
  const { id } = req.params;
  const { name, targetAmount, currentAmount, deadline } = req.body;

  try {
    
    const goal = await Goal.findByIdAndUpdate(id, { name, targetAmount, currentAmount, deadline }, { new: true });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    // Calculate updated progress
    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);

    res.status(200).json({
      message: "Goal updated successfully",
      goal,
      progress
    });
  } catch (error) {
    console.error("❌ Error updating goal:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//  Delete a goal by ID
const deleteGoal = async (req, res) => {
  const { id } = req.params;

  try {
    const goal = await Goal.findByIdAndDelete(id);

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting goal:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { addGoal, getGoals, updateGoal, deleteGoal };