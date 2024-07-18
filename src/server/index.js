const path = require('path');
const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const { extendApp: extendBotApp } = require('ringcentral-chatbot-core');

const notificationRoute = require('./routes/notification');
const subscriptionRoute = require('./routes/subscription');
const maintainRoute = require('./routes/maintain');

const { botHandler } = require('./bot/handler');
const { botConfig } = require('./bot/config');
const { errorLogger } = require('./utils/logger');
const { refererChecker } = require('./utils/refererChecker');

const app = express()
app.use(morgan(function (tokens, req, res) {
  let url = tokens.url(req, res);
  if (url.indexOf('/bot-notify/') === 0) {
    url = `/bot-notify/[MASK]-${url.slice(-5)}`; // mask from log
  }
  if (url.indexOf('/bot/oauth') === 0) {
    url = '/bot/oauth'; // mask from log
  }
  return [
    tokens.method(req, res),
    url,
    tokens.status(req, res),
    tokens.res(req, res, 'content-length'), '-',
    tokens['response-time'](req, res), 'ms'
  ].join(' ');
}));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.set('views', path.resolve(__dirname, './views'));
app.set('view engine', 'pug');
app.post('/notify/:id', notificationRoute.notification);
app.post('/notify_v2/:id', notificationRoute.notification);

app.get('/webhook/new', subscriptionRoute.setup);
app.post('/webhooks', refererChecker, subscriptionRoute.createWebhook);

app.post('/interactive-messages', notificationRoute.interactiveMessages);
app.get('/maintain/migrate-encrypted-data', maintainRoute.migrateEncryptedData);

// bots:
extendBotApp(app, [], botHandler, botConfig);
app.post('/bot-notify/:id', notificationRoute.botNotification);

app.use(function (err, req, res, next) {
  errorLogger(err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.json({ result: 'error', message: 'Internal server error' });
});

exports.app = app;
