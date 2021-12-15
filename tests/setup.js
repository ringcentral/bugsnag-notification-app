const { Webhook } = require('../src/server/models/webhook');
const { AuthToken } = require('../src/server/models/authToken');
const { RCWebhook } = require('../src/server/models/rc-webhook');

jest.setTimeout(30000);

beforeAll(async () => {
  await Webhook.sync();
  await AuthToken.sync();
  await RCWebhook.sync();
});
