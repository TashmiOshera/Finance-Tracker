const mongoose = require("mongoose");

// Goal Schema
const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Goal name is required"],
      trim: true,
      maxlength: [100, "Goal name cannot exceed 100 characters"],
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target amount must be at least 1"],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, "Current amount cannot be negative"],
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
      validate: {
        validator: function (value) {
          return value > Date.now();
        },
        message: "Deadline must be a future date",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", GoalSchema);
