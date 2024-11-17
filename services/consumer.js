const { Kafka } = require('kafkajs');
const CommunicationsLog = require('./models/CommunicationsLog'); // Import log model

const kafka = new Kafka({
  clientId: 'campaign-manager',
  brokers: ['localhost:9092'], // Kafka broker address
});

const consumer = kafka.consumer({ groupId: 'message-group' });

const consumeMessages = async () => {
  await consumer.connect();
  console.log('Consumer connected to Kafka');

  await consumer.subscribe({ topic: 'messageTopic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const task = JSON.parse(message.value.toString());
      console.log('Processing task from Kafka:', task);

      // Simulate message sending
      const success = Math.random() < 0.9; // 90% success rate
      const status = success ? 'SENT' : 'FAILED';

      // Save to communications log
      await CommunicationsLog.create({
        campaignId: task.campaignId,
        audienceId: task.audienceId,
        personalizedMessage: task.personalizedMessage,
        status,
        deliveryStatus: success ? 'DELIVERED' : 'FAILED',
      });

      console.log(`Task processed: ${status}`);
    },
  });
};

consumeMessages();
