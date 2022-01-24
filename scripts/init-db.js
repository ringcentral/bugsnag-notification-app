require('dotenv').config();
const { Webhook } = require('../src/server/models/webhook');
const { AuthToken } = require('../src/server/models/authToken');
const { RCWebhook } = require('../src/server/models/rc-webhook');

async function initDB() {
  await Webhook.sync();
  await AuthToken.sync();
  await RCWebhook.sync();
}

initDB();
