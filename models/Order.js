const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderAmount: { type: Number, required: true },
  orderDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', OrderSchema);
