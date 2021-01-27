const { MQ } = require('config');
const MessageBroker = require('..');
const { doSendBookingMail } = require('../../components/service-request/booking.service');

(async () => {
  try {
    const consumerEmitter = await MessageBroker.consume(MQ.BOOKING_NOTIFIER_KEY);
    consumerEmitter.on('data', async (message, ack) => {
      const order_id = +message;
      await doSendBookingMail(order_id);
      ack();
    });
    consumerEmitter.on('error', (error) => console.log(error));
    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
})();
