const Notification = require("../models/Notification"); // Import Notification model
const Budget = require("../models/Budget"); // Import Budget model
const Goal = require("../models/Goal"); // Import Goal model
const Transaction = require("../models/Transaction"); // Import Transaction model

// Function to check for unusual spending
const checkUnusualSpending = async (userId, category, totalSpent) => {
  try {
    if (totalSpent < 0) {
      console.log("Total spent cannot be negative.");
      return;
    }

    const budget = await Budget.findOne({ userId, category });
    if (!budget) {
      console.log(`No budget found for category: ${category}`);
      return;
    }

    const { limit } = budget;
    const balanceAfterSpending = limit - totalSpent;

    if (totalSpent > limit * 0.8 && totalSpent <= limit) {
      console.log(`User ${userId}: You are nearing your budget limit for ${category}!`);
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

    if (totalSpent > limit) {
      console.log(`User ${userId}: You have exceeded your budget for ${category}!`);
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
    const goals = await Goal.find({ userId });
    console.log(`Found ${goals.length} goals for user ${userId}`);

    if (!goals.length) {
      console.log(`No goals found for user ${userId}`);
      return;
    }

    for (let goal of goals) {
      const deadline = new Date(goal.deadline);
      const currentDate = new Date();
      const timeDifference = deadline - currentDate;

      console.log(`Goal "${goal.name}" deadline is in ${Math.ceil(timeDifference / (24 * 60 * 60 * 1000))} days.`);

      if (timeDifference <= 7 * 24 * 60 * 60 * 1000) {
        console.log(`User ${userId}: Your goal "${goal.name}" is nearing its deadline!`);
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

// Function to check for upcoming or missed recurring transactions
// Function to check for upcoming or missed recurring transactions
// Function to check for upcoming or missed recurring transactions
const checkRecurringTransactions = async (userId) => {
  try {
    const transactions = await Transaction.find({ userId, isRecurring: true });
    if (!transactions.length) {
      console.log(`No recurring transactions found for user ${userId}`);
      return;
    }

    const currentDate = new Date();
    console.log(`Current date: ${currentDate.toDateString()}`);

    for (let transaction of transactions) {
      if (!transaction.recurrence || !transaction.recurrence.nextDueDate) {
        console.log(`No next due date found for transaction ${transaction._id}`);
        continue;
      }
      
      const nextDueDate = new Date(transaction.recurrence.nextDueDate);
      console.log(`Transaction category: ${transaction.category}, Next due date: ${nextDueDate.toDateString()}`);

      // Check if the recurring transaction is upcoming
      if (nextDueDate > currentDate && (nextDueDate - currentDate) <= 7 * 24 * 60 * 60 * 1000) {
        console.log(`User ${userId}: Upcoming recurring transaction for ${transaction.category}`);

        await Notification.create({
          userId,
          category: "Recurring Transaction",
          message: `Reminder: You have an upcoming recurring transaction for ${transaction.category} on ${nextDueDate.toDateString()}.`,
          date: nextDueDate,
          type: "recurring",  // Added the type field
          recurringDetails: {
            transactionId: transaction._id,
            status: "upcoming"
          }
        });
        console.log("Upcoming recurring transaction notification saved successfully.");
      }

      // Check if the recurring transaction was missed
      if (nextDueDate < currentDate) {
        console.log(`User ${userId}: Missed recurring transaction for ${transaction.category}`);

        await Notification.create({
          userId,
          category: "Recurring Transaction",
          message: `You have a missed recurring transaction for ${transaction.category}. Please take action.`,
          date: nextDueDate,
          type: "recurring",  // Added the type field
          recurringDetails: {
            transactionId: transaction._id,
            status: "missed"
          }
        });
        console.log("Missed recurring transaction notification saved successfully.");
      }
    }
  } catch (error) {
    console.error("Error checking recurring transactions:", error.message);
  }
};

module.exports = { checkUnusualSpending, checkGoalDeadlines, checkRecurringTransactions };
