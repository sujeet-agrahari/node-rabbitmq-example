const amqp = require('amqplib');
const EventEmitter = require('events');

const { MQ } = require('config');

const produce = async (queue, message, durable = false, persistent = false) => {
  const connect = await amqp.connect(MQ.URL);
  const channel = await connect.createChannel();

  await channel.assertQueue(queue, { durable });
  await channel.sendToQueue(queue, Buffer.from(message), { persistent });

  console.log('Message produced: ', queue, message);
};

const consume = async (
  queue,
  isNoAck = false,
  durable = true,
  prefetch = null,
) => {
  const connect = await amqp.connect(MQ.URL);
  const channel = await connect.createChannel();

  await channel.assertQueue(queue, { durable });

  if (prefetch) {
    channel.prefetch(prefetch);
  }
  const consumeEmitter = new EventEmitter();
  try {
    channel.consume(
      queue,
      (message) => {
        if (message !== null) {
          consumeEmitter.emit('data', message.content.toString(), () => channel.ack(message));
        } else {
          const error = new Error('NullMessageException');
          consumeEmitter.emit('error', error);
        }
      },
      { noAck: isNoAck },
    );
  } catch (error) {
    consumeEmitter.emit('error', error);
  }
  return consumeEmitter;
};

const publish = async (routingKey, message) => {
  const connect = await amqp.connect(MQ.URL);
  const channel = await connect.createChannel();
  await channel.assertExchange(MQ.EXCHANGE_NAME, MQ.EXCHANGE_TYPE, { durable: true });
  await channel.publish(MQ.EXCHANGE_NAME, routingKey, Buffer.from(message), {
    persistent: true,
  });
  console.log('Message published: ', MQ.EXCHANGE_NAME, message);
};

const subscribe = async () => {
  const connect = await amqp.connect(MQ.URL);
  const channel = await connect.createChannel();
  await channel.assertExchange(MQ.EXCHANGE_NAME, MQ.EXCHANGE_TYPE, { durable: true });
  const queue = await channel.assertQueue('', { exclusive: true });
  channel.bindQueue(queue.queue, MQ.EXCHANGE_NAME, '');
  const consumeEmitter = new EventEmitter();

  try {
    channel.consume(
      queue.queue,
      (message) => {
        if (message !== null) {
          consumeEmitter.emit('data', message.content.toString());
        } else {
          const error = new Error('NullMessageException');
          consumeEmitter.emit('error', error);
        }
      },
      { noAck: true },
    );
  } catch (error) {
    consumeEmitter.emit('error', error);
  }
  return consumeEmitter;
};

module.exports = {
  produce,
  consume,
  publish,
  subscribe,
};
