const mongoose = require("mongoose");
const axios = require("axios");
const { convertCurrency } = require("../utils/currencyConverter"); // Adjust path

const API_KEY = "f0c2f100eeff2a348e2118fc";

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
];

// List of valid recurrence patterns
const recurrencePatterns = ["daily", "weekly", "monthly", "yearly"];

const transactionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      enum: categories,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, "Amount must be a positive number"],
    },
    transactionCurrency: {
      type: String,
      required: true,
      default: "USD",
    },
    exchangeRate: {
      type: Number,
      default: 1,
    },
    convertedAmount: {
      type: Number,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    tags: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.every((tag) => tag.startsWith("#"));
        },
        message: 'Tags must start with "#"',
      },
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrence: {
      pattern: {
        type: String,
        enum: recurrencePatterns,
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      nextDueDate: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);


transactionSchema.pre("save", function (next) {
  this.convertedAmount = this.currency === "LKR" ? this.amount : this.amount * this.exchangeRate;
  next();
});




// Middleware to handle recurring transactions and currency conversion
transactionSchema.pre("save", async function (next) {
  try {
    // Fetch the user’s base currency from the User model
    const user = await mongoose.model("User").findById(this.userId);

    if (!user) {
      console.warn(`User not found for ID: ${this.userId}`);
      this.baseCurrency = "USD"; // Default to USD if user not found
    } else {
      this.baseCurrency = user.baseCurrency || "USD"; // Default if not set
    }





    // Ensure recurrence object is always initialized
    if (this.isRecurring) {
      if (!this.recurrence) {
        this.recurrence = {};
      }

      // Set default values if not present
      if (!this.recurrence.pattern) {
        this.recurrence.pattern = "monthly"; // Default recurrence pattern
      }
      if (!this.recurrence.startDate) {
        this.recurrence.startDate = this.date || new Date();
      }
      if (!this.recurrence.endDate) {
        this.recurrence.endDate = new Date(this.recurrence.startDate);
        this.recurrence.endDate.setFullYear(
          this.recurrence.endDate.getFullYear() + 1
        );
      }
      if (!this.recurrence.nextDueDate) {
        this.recurrence.nextDueDate = calculateNextDueDate(
          this.recurrence.pattern,
          this.recurrence.startDate
        );
      }
    } else {
      this.recurrence = undefined; // Remove recurrence if not enabled
    }



    next();
  } catch (error) {
    console.error("Error in transaction pre-save middleware:", error);
    next(error);
  }
});






// Function to calculate the next due date
function calculateNextDueDate(pattern, currentDate) {
  const date = new Date(currentDate);
  switch (pattern) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return date;
}

module.exports = mongoose.model("Transaction", transactionSchema);
