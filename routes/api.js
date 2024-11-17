const express = require('express');
const router = express.Router();
const Customer = require(__dirname + '/../models/Customer'); // Import Customer model
const Order = require('../models/Order'); // Import Order model
const Campaign = require('../models/Campaign'); // Import Campaign model
const CommunicationsLog = require('../models/CommunicationsLog');
const produceMessages = require('../services/producer'); // Import Kafka producer

// ----- Customer APIs -----

// Add a customer
router.post('/customers', async (req, res) => {
  const { name, email, phone, totalSpend, visitCount, lastVisit } = req.body;

  try {
    const newCustomer = new Customer({ name, email, phone, totalSpend, visitCount, lastVisit });
    const savedCustomer = await newCustomer.save();
    res.status(201).json({ message: 'Customer added successfully', data: savedCustomer });
  } catch (err) {
    console.error('Error adding customer:', err);
    res.status(500).json({ error: 'Failed to add customer' });
  }
});

// Get all customers
router.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.status(200).json(customers);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Delete a customer by ID
router.delete('/customers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCustomer = await Customer.findByIdAndDelete(id);
    if (!deletedCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.status(200).json({ message: 'Customer deleted successfully', data: deletedCustomer });
  } catch (err) {
    console.error('Error deleting customer:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// ----- Campaign APIs -----

// Get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.status(200).json(campaigns);
  } catch (err) {
    console.error('Error fetching campaigns:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Create a campaign with AND/OR logic
router.post('/campaigns', async (req, res) => {
  const { name, audienceFilter } = req.body;

  try {
    const { totalSpend, visitCount, lastVisit, logic = 'AND' } = audienceFilter || {};

    const conditions = [];
    if (totalSpend) conditions.push({ totalSpend: { $gte: Number(totalSpend) } });
    if (visitCount) conditions.push({ visitCount: { $lte: Number(visitCount) } });
    if (lastVisit) conditions.push({ lastVisit: { $lte: new Date(lastVisit) } });

    let filter = {};
    if (logic === 'OR') {
      filter = { $or: conditions }; // OR logic
    } else {
      filter = { $and: conditions }; // AND logic (default)
    }

    const audience = await Customer.find(filter);
    const audienceIds = audience.map((customer) => customer._id);

    const newCampaign = new Campaign({
      name,
      audienceSize: audienceIds.length,
      audience: audienceIds,
    });

    const savedCampaign = await newCampaign.save();
    res.status(201).json({ message: 'Campaign created successfully', data: savedCampaign });
  } catch (err) {
    console.error('Error creating campaign:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Add audience to a campaign
router.post('/campaigns/:id/audience', async (req, res) => {
  const { id } = req.params;
  const { customerIds } = req.body;

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    campaign.audience = [...new Set([...campaign.audience, ...customerIds])];
    campaign.audienceSize = campaign.audience.length;

    await campaign.save();

    res.status(200).json({ message: 'Audience added successfully', data: campaign });
  } catch (err) {
    console.error('Error adding audience to campaign:', err);
    res.status(500).json({ error: 'Failed to add audience to campaign' });
  }
});

// Send personalized messages using Kafka
router.post('/campaigns/:id/send', async (req, res) => {
  const { id } = req.params;
  const { messageTemplate } = req.body;

  try {
    const campaign = await Campaign.findById(id).populate('audience', '_id name email');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    const tasks = campaign.audience.map((audienceMember) => ({
      campaignId: campaign._id,
      audienceId: audienceMember._id,
      personalizedMessage: messageTemplate
        .replace('{{name}}', audienceMember.name)
        .replace('{{email}}', audienceMember.email),
    }));

    // Publish tasks to Kafka
    await produceMessages(tasks);

    res.status(200).json({ message: 'Messages published to Kafka successfully' });
  } catch (err) {
    console.error('Error publishing messages:', err);
    res.status(500).json({ error: 'Failed to publish messages' });
  }
});

// Get communication logs by campaign ID
router.get('/campaigns/:id/logs', async (req, res) => {
  const { id } = req.params;

  try {
    const logs = await CommunicationsLog.find({ campaignId: id }).populate('audienceId', 'name email');
    res.status(200).json(logs);
  } catch (err) {
    console.error('Error fetching communication logs:', err);
    res.status(500).json({ error: 'Failed to fetch communication logs' });
  }
});

// Update delivery status for a communication log
router.patch('/campaigns/:campaignId/logs/:logId', async (req, res) => {
  const { campaignId, logId } = req.params;
  const { deliveryStatus } = req.body;

  try {
    if (!['DELIVERED', 'FAILED'].includes(deliveryStatus)) {
      return res.status(400).json({ error: 'Invalid delivery status' });
    }

    const log = await CommunicationsLog.findOneAndUpdate(
      { _id: logId, campaignId },
      { deliveryStatus },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    res.status(200).json({ message: 'Delivery status updated successfully', data: log });
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
});

module.exports = router;
