require('dotenv').config();
const { Webhook } = require('../src/app/models/webhook');
const { AuthToken } = require('../src/app/models/authToken');
const { RCWebhook } = require('../src/app/models/rc-webhook');

async function initDB() {
  await Webhook.sync();
  await AuthToken.sync();
  await RCWebhook.sync();
}

initDB();
