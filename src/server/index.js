const path = require('path');
const { extendApp: extendBotApp } = require('ringcentral-chatbot-core');

const notificationRoute = require('./routes/notification');
const subscriptionRoute = require('./routes/subscription');
const { botHandler, botInteractiveMessagesHandler } = require('./bot/handler');
const { botConfig } = require('./bot/config');

exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');
  app.post('/notify/:id', notificationRoute.notification);
  app.post('/notify_v2/:id', notificationRoute.notification);

  app.get('/webhook/new', subscriptionRoute.setup);
  app.post('/webhooks', subscriptionRoute.createWebhook);

  app.post('/interactive-messages', notificationRoute.interactiveMessages);

  // bots:
  extendBotApp(app, [], botHandler, botConfig);
  app.post('/bot-notify/:id', notificationRoute.botNotification);
};
