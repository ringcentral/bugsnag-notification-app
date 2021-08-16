require('dotenv').config();
const { Webhook } = require('../src/app/models/webhook');
const { AuthToken } = require('../src/app/models/authToken');

async function initDB() {
  await Webhook.sync();
  await AuthToken.sync();
}

initDB();
