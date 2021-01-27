// this is sample that can be use to queue a job
await MessageBroker.publish(MQ.CLEAR_CART_KEY, JSON.stringify({
  cart_id,
}));
if (combos.length) {
  await MessageBroker.publish(MQ.COMBO_USE_KEY, JSON.stringify({
    combos,
    user_id: userId,
  }));
} else if (services.length) {
  await MessageBroker.publish(MQ.BOOKING_CREATION_KEY, JSON.stringify({
    order_id,
    user_id: userId,
    requestedServices: services,
  }));
}
if (orderInDb.coins_used && orderInDb.coins_used > 0) {
  await MessageBroker.publish(MQ.WALLET_DEDUCTION_KEY, JSON.stringify({
    order_id,
    user_id: userId,
    amount: orderInDb.coins_used,
    transactionType: `Debited against order number ${orderInDb.order_number}`,
  }));
}
if (orderInDb.coupon_discount && orderInDb.coupon_discount > 0) {
  await MessageBroker.publish(MQ.COUPON_USE_KEY, JSON.stringify({
    user_id: userId,
    coupon_id: orderNotes.coupon_id,
    coupon_discount: orderInDb.coupon_discount,
  }));
}
await MessageBroker.publish(MQ.BOOKING_NOTIFIER_KEY, JSON.stringify({
  order_id,
  user_id: userId,
}));