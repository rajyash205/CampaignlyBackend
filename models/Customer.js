const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  totalSpend: { type: Number, default: 0 },
  visitCount: { type: Number, default: 0 },
  lastVisit: { type: Date },
});

module.exports = mongoose.model('Customer', CustomerSchema);
