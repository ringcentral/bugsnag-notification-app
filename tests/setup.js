const { Webhook } = require('../src/app/models/webhook');
const { AuthToken } = require('../src/app/models/authToken');
const { RCWebhook } = require('../src/app/models/rc-webhook');

jest.setTimeout(30000);

beforeAll(async () => {
  await Webhook.sync();
  await AuthToken.sync();
  await RCWebhook.sync();
});
