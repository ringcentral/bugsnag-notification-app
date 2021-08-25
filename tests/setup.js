const { Webhook } = require('../src/app/models/webhook');
const { AuthToken } = require('../src/app/models/authToken');
const { RCWebhook } = require('../src/app/models/rc-webhook');

beforeAll(async () => {
  await Webhook.sync();
  await AuthToken.sync();
  await RCWebhook.sync();
});
