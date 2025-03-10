const Notification = require("../models/Notification");
const Budget = require("../models/Budget");
const Goal = require("../models/Goal");
const Transaction = require("../models/Transaction");


const checkUnusualSpending = async (userId, category, totalSpent) => {
  try {
    const budget = await Budget.findOne({ userId, category });
    if (!budget) return;

    const { limit } = budget;
    const balanceAfterSpending = limit - totalSpent;

    if (totalSpent > limit * 0.8 && totalSpent <= limit) {
      await Notification.create({
        userId,
        category,
        message: `You have spent over 80% of your budget for ${category}.`,
        limit,
        totalSpent,
        balanceAfterSpending,
        type: "budget",
      });
    }

    if (totalSpent > limit) {
      await Notification.create({
        userId,
        category,
        message: `You have exceeded your budget for ${category} by ${totalSpent - limit}.`,
        limit,
        totalSpent,
        balanceAfterSpending,
        type: "budget",
      });
    }
  } catch (error) {
    console.error("Error checking unusual spending:", error.message);
  }
};



const checkGoalDeadlines = async (userId) => {
  try {
    const goals = await Goal.find({ userId });
    if (!goals.length) return;

    const currentDate = new Date();

    for (let goal of goals) {
      const deadline = new Date(goal.deadline);
      const timeDifference = deadline - currentDate;
      const daysLeft = Math.ceil(timeDifference / (24 * 60 * 60 * 1000));

      if (daysLeft <= 7 && daysLeft > 0) {
        await Notification.create({
          userId,
          category: "Goal Reminder",
          message: `Your goal "${goal.name}" is due soon. You have ${daysLeft} days left.`,
          type: "goal",
        });
      }
    }
  } catch (error) {
    console.error("Error checking goal deadlines:", error.message);
  }
};



const checkRecurringTransactions = async (userId) => {
  try {
    const transactions = await Transaction.find({ userId, isRecurring: true });

    if (!transactions.length) return;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let transaction of transactions) {
      if (!transaction.recurrence || !transaction.recurrence.nextDueDate) continue;

      const nextDueDate = new Date(transaction.recurrence.nextDueDate);
      nextDueDate.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.ceil((nextDueDate - currentDate) / (24 * 60 * 60 * 1000));

      if (daysUntilDue > 0 && daysUntilDue <= 7) {
        await Notification.create({
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
      }
    }
  } catch (error) {
    console.error("Error checking recurring transactions:", error.message);
  }
};

module.exports = { checkUnusualSpending, checkGoalDeadlines, checkRecurringTransactions };
