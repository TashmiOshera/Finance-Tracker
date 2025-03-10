const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'], 
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, 
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 
        'Please provide a valid email address', 
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'], 
      validate: {
        validator: function (value) {
          
          return /[a-zA-Z]/.test(value) && /\d/.test(value);
        },
        message: 'Password must contain at least one letter and one number',
      },
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user'],
        message: 'Role must be either "admin" or "user"', 
      },
      default: 'user',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10); 
  next();
});

module.exports = mongoose.model('User', userSchema);
