const mongoose = require('mongoose');

const CommunicationsLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  audienceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  status: { type: String, enum: ['SENT', 'FAILED'], required: true },
  sentAt: { type: Date, default: Date.now },
  personalizedMessage: { type: String, required: true }, // Store personalized message
  deliveryStatus: { type: String, enum: ['PENDING', 'DELIVERED', 'FAILED'], default: 'PENDING' } // Track delivery status
});

module.exports = mongoose.model('CommunicationsLog', CommunicationsLogSchema);
