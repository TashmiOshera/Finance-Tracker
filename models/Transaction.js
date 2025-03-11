const mongoose = require("mongoose");

// List of valid categories for transactions
const categories = [
  "Food",
  "Transportation",
  "Entertainment",
  "Bills",
  "Shopping",
  "Salary",
  "Rent",
  "Healthcare",
  "Investment",
  "Others",
  "Hobbies",
  "Books",
  "Savings",
  "Fitness",
];

// List of valid recurrence patterns
const recurrencePatterns = ["daily", "weekly", "monthly", "yearly"];

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["income", "expense"], required: true },
  category: { type: String, required: true, enum: categories },
  currency: { type: String, required: true, default: "LKR" },
  exchangeRate: { type: Number, default: 1 },
  convertedAmount: { type: Number },
  tags: { type: [String] },
  recurring: { type: Boolean, default: false },
  recurrencePattern: { type: String, enum: recurrencePatterns, default: null },
  date: { type: Date, default: Date.now },
});

// Middleware to handle currency conversion, recurring transactions, and automatic savings allocation
transactionSchema.pre("save", async function (next) {
  try {
    // Fetch the user’s base currency from the User model
    const user = await mongoose.model("User").findById(this.userId);
    const baseCurrency = user ? user.baseCurrency || "USD" : "USD";

    // Convert the amount if necessary
    this.convertedAmount = this.currency === "LKR" ? this.amount : this.amount * this.exchangeRate;

    // Ensure recurrence is properly set
    if (this.recurring && !this.recurrencePattern) {
      this.recurrencePattern = "monthly"; // Default recurrence pattern
    }

    // Automatic savings allocation if transaction type is "income"
    if (this.type === "income") {
      const savingsPercentage = 10; // Define savings percentage (e.g., 10%)
      const savingsAmount = (this.amount * savingsPercentage) / 100;

      if (savingsAmount > 0) {
        // Create a new savings transaction
        const savingsTransaction = new mongoose.model("Transaction")({
          userId: this.userId,
          type: "expense", // Treat savings as an expense
          category: "Savings", // Allocate to the Savings category
          amount: savingsAmount,
          currency: this.currency,
          exchangeRate: this.exchangeRate,
          convertedAmount: savingsAmount * this.exchangeRate,
          tags: ["Automatic Savings"],
          date: new Date(),
        });

        // Save the savings transaction
        await savingsTransaction.save();
      }
    }

    next();
  } catch (error) {
    console.error("Error in transaction pre-save middleware:", error);
    next(error);
  }
});

module.exports = mongoose.model("Transaction", transactionSchema);
