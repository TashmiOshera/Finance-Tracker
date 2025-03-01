const mongoose = require('mongoose');

const settingSchema = mongoose.Schema(
  {
    categories: {
      type: [String],
      default: ['Food', 'Transport', 'Bills'],
    },
    limits: {
      type: Map,
      of: Number,
      default: { Food: 200, Transport: 100, Bills: 300 },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
