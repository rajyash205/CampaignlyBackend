const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  audienceSize: { type: Number, required: true },
  audience: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }], // Array of customer IDs
  messagesSent: { type: Number, default: 0 },
  messagesFailed: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Campaign', CampaignSchema);
