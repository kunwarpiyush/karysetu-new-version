const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true
  },
  Mobile: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['worker', 'employer'],
    required: true
  },
  Password: {
    type: String,
    required: true
  },
  Aadhar_cardNumber: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('User', userSchema);
