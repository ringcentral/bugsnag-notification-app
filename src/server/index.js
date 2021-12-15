const path = require('path');
const notificationRoute = require('./routes/notification');
const subscriptionRoute = require('./routes/subscription');

exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');
  app.post('/notify/:id', notificationRoute.notification);
  app.post('/notify_v2/:id', notificationRoute.notification);

  app.post('/interactive-messages', notificationRoute.interactiveMessages);

  app.get('/webhook/new', subscriptionRoute.setup);

  app.post('/webhooks', subscriptionRoute.createWebhook);
}
