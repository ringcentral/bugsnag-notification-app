require('dotenv').config();
const { Webhook } = require('../src/models/webhook');

async function initDB() {
  await Webhook.sync();
}

initDB();
