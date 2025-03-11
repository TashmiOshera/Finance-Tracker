const Notification = require("../models/Notification");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");


const checkUnusualSpending = async (userId, category, totalSpent) => {
  try {
    console.log("🔍 Checking unusual spending for:", { userId, category, totalSpent });

    const budget = await Budget.findOne({ userId, category });

    if (!budget) {
      console.log("🚨 No budget found for this category.");
      return;
    }

    console.log("📊 Budget details:", budget);

    const { limit } = budget;
    const balanceAfterSpending = limit - totalSpent;

    if (totalSpent > limit * 0.8 && totalSpent <= limit) {
      console.log("⚠️ Warning: Spending over 80% of budget!");

      const notification = await Notification.create({
        userId,
        category,
        message: `You have spent over 80% of your budget for ${category}.`,
        limit,
        totalSpent,
        balanceAfterSpending,
        type: "budget_exceeded",
      });

      console.log("✅ 80% budget warning notification created:", notification);
    }

    if (totalSpent > limit) {
      console.log("🚨 Budget exceeded! Sending notification.");

      const notification = await Notification.create({
        userId,
        category,
        message: `You have exceeded your budget for ${category} by ${totalSpent - limit}.`,
        limit,
        totalSpent,
        balanceAfterSpending,
        type: "budget_exceeded",
      });

      console.log("✅ Budget exceeded notification created:", notification);
    }
  } catch (error) {
    console.error("❌ Error in checkUnusualSpending:", error.message);
  }
};


const checkGoalDeadlines = async (userId) => {
  try {
    console.log(`🔍 Checking goal deadlines for User: ${userId}`);

    const goals = await Goal.find({ userId });
    if (!goals.length) {
      console.log("🚨 No goals found.");
      return;
    }

    const currentDate = new Date();

    for (let goal of goals) {
      const deadline = new Date(goal.deadline);
      const daysLeft = Math.ceil((deadline - currentDate) / (24 * 60 * 60 * 1000));

      console.log(`📅 Goal: ${goal.name}, Deadline: ${goal.deadline}, Days Left: ${daysLeft}`);

      if (daysLeft <= 7 && daysLeft > 0) {
        const notification = await Notification.create({
          userId,
          category: "Goal Reminder",
          message: `Your goal "${goal.name}" is due soon. You have ${daysLeft} days left.`,
          type: "goal",
        });

        console.log(`✅ Goal Notification Created: ${notification}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking goal deadlines:", error.message);
  }
};


const checkRecurringTransactions = async (userId) => {
  try {
    console.log(`🔍 Checking recurring transactions for User: ${userId}`);

    const transactions = await Transaction.find({ userId, isRecurring: true });

    if (!transactions.length) {
      console.log("🚨 No recurring transactions found.");
      return;
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let transaction of transactions) {
      if (!transaction.recurrence || !transaction.recurrence.nextDueDate) continue;

      const nextDueDate = new Date(transaction.recurrence.nextDueDate);
      nextDueDate.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.ceil((nextDueDate - currentDate) / (24 * 60 * 60 * 1000));

      console.log(`🔄 Transaction: ${transaction.category}, Next Due: ${nextDueDate}, Days Left: ${daysUntilDue}`);

      if (daysUntilDue > 0 && daysUntilDue <= 7) {
        const notification = await Notification.create({
          userId,
          category: "Recurring Transaction",
          message: `Upcoming transaction for ${transaction.category} in ${daysUntilDue} days.`,
          type: "recurring",
          recurringDetails: {
            transactionId: transaction._id,
            status: "upcoming",
            taskName: transaction.name || "Recurring Task",
            amount: transaction.amount,
            nextDueDate: nextDueDate,
          },
        });

        console.log(`✅ Recurring Transaction Notification Created: ${notification}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking recurring transactions:", error.message);
  }
};


module.exports = { checkUnusualSpending, checkGoalDeadlines, checkRecurringTransactions };
