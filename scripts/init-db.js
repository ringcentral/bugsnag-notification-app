require('dotenv').config();
const { Webhook } = require('../src/app/models/webhook');

async function initDB() {
  await Webhook.sync();
}

initDB();
