require('dotenv').config();
const { Webhook } = require('../src/server/models/webhook');

async function initDB() {
  await Webhook.sync();
}

initDB();
