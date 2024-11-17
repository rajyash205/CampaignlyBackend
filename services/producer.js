const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'campaign-manager',
  brokers: ['localhost:9092'], // Kafka broker address
});

const producer = kafka.producer();

const produceMessages = async (tasks) => {
  await producer.connect();
  console.log('Producer connected to Kafka');

  for (const task of tasks) {
    await producer.send({
      topic: 'messageTopic',
      messages: [
        {
          value: JSON.stringify(task),
        },
      ],
    });
    console.log('Published task to Kafka:', task);
  }

  await producer.disconnect();
};

module.exports = produceMessages;
