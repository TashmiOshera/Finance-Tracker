const Goal = require('../models/Goal');

// Add a financial goal
const addGoal = async (req, res) => {
  const { name, targetAmount, deadline, currentAmount } = req.body;

  if (!name || !targetAmount || !deadline) {
    return res.status(400).json({ message: "Name, target amount, and deadline are required." });
  }

  try {
    const goal = new Goal({
      userId: req.user.id,
      name,
      targetAmount,
      deadline,
      currentAmount: currentAmount || 0,
    });

    await goal.save();
    res.status(201).json({ message: "Financial goal added successfully", goal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all financial goals for the authenticated user
const getGoals = async (req, res) => {
    try {
      const goals = await Goal.find({ userId: req.user.id });
  
      const goalsWithProgress = goals.map(goal => ({
        ...goal._doc,
        progress: ((goal.currentAmount / goal.targetAmount) * 100).toFixed(2) // Calculate % progress
      }));
  
      res.status(200).json({ goals: goalsWithProgress });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  

module.exports = { addGoal, getGoals };
