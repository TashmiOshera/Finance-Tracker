const Notification = require("../models/Notification"); // Import Notification model
const Budget = require("../models/Budget"); // Import Budget model
const Goal = require("../models/Goal"); // Import Goal model

// Function to check for unusual spending
const checkUnusualSpending = async (userId, category, totalSpent) => {
  try {
    // Validate that totalSpent is a positive number
    if (totalSpent < 0) {
      console.log("Total spent cannot be negative.");
      return;
    }

    // Find the budget for the category
    const budget = await Budget.findOne({ userId, category });

    if (!budget) {
      console.log(`No budget found for category: ${category}`);
      return;
    }

    const { limit } = budget;
    const balanceAfterSpending = limit - totalSpent;

    // Check if spending exceeds 80% but not the full limit
    if (totalSpent > limit * 0.8 && totalSpent <= limit) {
      console.log(`User ${userId}: You are nearing your budget limit for ${category}!`);

      // Create a notification for nearing budget
      await Notification.create({
        userId,
        category,
        message: `You have spent over 80% of your budget for ${category}. Please review your spending.`,
        limit,
        totalSpent,
        balanceAfterSpending,
      });

      console.log("Notification saved successfully for nearing budget.");
    }

    // Check if spending exceeds 100% of the limit (fully exceeded budget)
    if (totalSpent > limit) {
      console.log(`User ${userId}: You have exceeded your budget for ${category}!`);

      // Create a notification for exceeding budget
      await Notification.create({
        userId,
        category,
        message: `You have exceeded your budget for ${category} by ${totalSpent - limit}. Please review your spending.`,
        limit,
        totalSpent,
        balanceAfterSpending,
      });

      console.log("Notification saved successfully for exceeding budget.");
    }
  } catch (error) {
    console.error("Error checking unusual spending:", error.message);
  }
};

// Function to check goal deadlines
const checkGoalDeadlines = async (userId) => {
  try {
    // Find all goals for the user
    const goals = await Goal.find({ userId });

    console.log(`Found ${goals.length} goals for user ${userId}`);  // Log the number of goals

    for (let goal of goals) {
      const deadline = new Date(goal.deadline);
      const currentDate = new Date();
      const timeDifference = deadline - currentDate;

      // Log time difference
      console.log(`Goal "${goal.name}" deadline is in ${Math.ceil(timeDifference / (24 * 60 * 60 * 1000))} days.`);

      // If the goal's deadline is within the next 7 days
      if (timeDifference <= 7 * 24 * 60 * 60 * 1000) {
        console.log(`User ${userId}: Your goal "${goal.name}" is nearing its deadline!`);

        // Create a notification about the upcoming deadline
        await Notification.create({
          userId,
          category: "Goal Reminder",
          message: `Reminder: Your goal "${goal.name}" is due soon. You have ${Math.ceil(timeDifference / (24 * 60 * 60 * 1000))} days left.`,
          limit: goal.targetAmount,
          totalSpent: goal.currentAmount,
          balanceAfterSpending: goal.targetAmount - goal.currentAmount,
        });

        console.log("Goal reminder notification saved successfully.");
      }
    }
  } catch (error) {
    console.error("Error checking goal deadlines:", error.message);
  }
};


// Export both functions
module.exports = { checkUnusualSpending, checkGoalDeadlines };
