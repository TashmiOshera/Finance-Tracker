const mongoose = require('mongoose');

// List of valid categories for transactions
const categories = [
  'Food',
  'Transportation',
  'Entertainment',
  'Bills',
  'Shopping',
  'Salary',
  'Rent',
  'Healthcare',
  'Investment',
  'Others',
];

// List of valid recurrence patterns
const recurrencePatterns = ['daily', 'weekly', 'monthly', 'yearly'];

const transactionSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Reference to the User model
      required: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'], // Either income or expense
      required: true,
    },
    category: {
      type: String,
      enum: categories, // Ensures category is one of the predefined values
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be a positive number'], // Validation for positive amounts
    },
    date: {
      type: Date,
      default: () => Date.now(), // Automatically sets to current date and time
    },
    note: {
      type: String,
      maxlength: [500, 'Note cannot exceed 500 characters'], // Optional: Limit length of the note
    },
    tags: {
      type: [String], // Array of strings for custom tags
      validate: {
        validator: function (v) {
          return v.every(tag => tag.startsWith('#')); // Ensures all tags start with '#'
        },
        message: 'Tags must start with "#"',
      },
    },
    // Recurrence fields
    isRecurring: {
      type: Boolean,
      default: true, // Whether the transaction is recurring
    },
    recurrence: {
      pattern: {
        type: String,
        enum: recurrencePatterns, // daily, weekly, monthly, yearly
      },
      
      startDate: {
        type: Date,
         // When the first transaction happens
      },
      endDate: {
        type: Date, // When the recurring transaction should end
      },
      nextDueDate: {
        type: Date, // The next due date for the recurring transaction
        
      },
    },
  },
  {
    timestamps: true, // To automatically add createdAt and updatedAt fields
  }
);

// Middleware to calculate the next due date for recurring transactions
transactionSchema.pre('save', function (next) {
  if (this.isRecurring) {
    // Calculate the next due date for recurring transactions
    const currentDate = this.date || Date.now();
    if (this.recurrence && this.recurrence.pattern && this.recurrence.interval) {
      const { pattern, interval, nextDueDate } = this.recurrence;
      this.recurrence.nextDueDate = calculateNextDueDate(pattern, interval, nextDueDate || currentDate);
    }
  }
  next();
});

// Function to calculate the next due date based on recurrence pattern

module.exports = mongoose.model('Transaction', transactionSchema);
