const mongoose = require('mongoose');

// Define valid report types
const validReportTypes = ['expense', 'income', 'budget', 'savings', 'investment'];

const reportSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'] 
  },
  type: { 
    type: String, 
    required: [true, 'Report type is required'],
    enum: {
      values: validReportTypes, 
      message: '{VALUE} is not a valid report type' 
    }
  },
  data: { 
    type: Object, 
    required: [true, 'Data is required'],
    validate: {
      validator: function(value) {
        // Custom validation to ensure data is an object (you can expand this further)
        return typeof value === 'object' && value !== null;
      },
      message: 'Data must be a valid object'
    }
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    validate: {
      validator: function(value) {
        
        return value instanceof Date && !isNaN(value);
      },
      message: 'CreatedAt must be a valid date'
    }
  }
}, { timestamps: true }); 

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;
