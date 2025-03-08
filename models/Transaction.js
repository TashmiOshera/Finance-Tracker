const mongoose = require('mongoose');
const axios = require('axios');

const API_KEY = 'f0c2f100eeff2a348e2118fc'; // Only the key

// List of valid categories for transactions
const categories = [
  'Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping',
  'Salary', 'Rent', 'Healthcare', 'Investment', 'Others'
];

// List of valid recurrence patterns
const recurrencePatterns = ['daily', 'weekly', 'monthly', 'yearly'];

const transactionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
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
      min: [0, 'Amount must be a positive number'],
    },
    transactionCurrency: {
      type: String,
      required: true,
      default: 'USD',
    },
    
    exchangeRate: {
      type: Number,
      default: 1,
    },
    convertedAmount: {
      type: Number, // Amount in base currency
    },
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'],
    },
    tags: {
      type: [String],
      validate: {
        validator: function (v) {
          return v.every(tag => tag.startsWith('#'));
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

// Virtual field to format the amount with currency
transactionSchema.virtual('formattedAmount').get(function () {
  return `${this.transactionCurrency} ${this.amount.toFixed(2)}`;
});

// Middleware to handle recurring transactions and currency conversion
transactionSchema.pre('save', async function (next) {
  try {
    // Fetch the user’s base currency from the User model
    const user = await mongoose.model('User').findById(this.userId);

    if (!user) {
      console.warn(`User not found for ID: ${this.userId}`);
      this.baseCurrency = 'USD'; // Default to USD if user not found
    } else {
      this.baseCurrency = user.baseCurrency || 'USD'; // Default if not set
    }

    // Handle recurring transactions
    if (this.isRecurring) {
      if (!this.recurrence) {
        this.recurrence = {}; // Ensure it exists
      }
      if (!this.recurrence.startDate) {
        this.recurrence.startDate = this.date || new Date();
      }
      if (!this.recurrence.endDate) {
        this.recurrence.endDate = new Date(this.recurrence.startDate);
        this.recurrence.endDate.setFullYear(this.recurrence.endDate.getFullYear() + 1);
      }
      if (this.recurrence.pattern) {
        this.recurrence.nextDueDate = calculateNextDueDate(this.recurrence.pattern, this.recurrence.startDate);
      }
    } else {
      this.recurrence = undefined; // Remove recurrence if not enabled
    }

    // Convert currency if needed
    if (this.transactionCurrency !== this.baseCurrency) {
      try {
        this.exchangeRate = await getExchangeRate(this.transactionCurrency, this.baseCurrency);
        this.convertedAmount = this.amount * this.exchangeRate;
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
        this.exchangeRate = 1;
        this.convertedAmount = this.amount;
      }
    } else {
      this.exchangeRate = 1;
      this.convertedAmount = this.amount;
    }

    next();
  } catch (error) {
    console.error('Error in transaction pre-save middleware:', error);
    next(error);
  }
});

// Function to calculate the next due date
function calculateNextDueDate(pattern, currentDate) {
  const date = new Date(currentDate);
  switch (pattern) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return date;
}

// Function to fetch real-time exchange rates
async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    const url = `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${fromCurrency}`;
    const response = await axios.get(url);

    if (response.data.result !== 'success') {
      throw new Error(`Failed to fetch exchange rate: ${response.data.error}`);
    }

    return response.data.conversion_rates[toCurrency] || 1;
  } catch (error) {
    console.error('Error fetching exchange rate:', error.message);
    return 1; // Default to 1 if API fails
  }
}

module.exports = mongoose.model('Transaction', transactionSchema);
