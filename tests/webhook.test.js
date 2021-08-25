const request = require('supertest');
const { server } = require('../src/server');
const { Webhook } = require('../src/app/models/webhook');
const { RCWebhook } = require('../src/app/models/rc-webhook');

describe('Webhook new', () => {
  it('should get 404 without webhook uri', async () => {
    const res = await request(server).get('/webhook/new');
    expect(res.status).toEqual(404);
  });

  it('should get new webhook page successfully', async () => {
    const res = await request(server).get('/webhook/new?webhook=http://test.com');
    expect(res.status).toEqual(200);
  });
});

describe('Webhook generate', () => {
  it('should get 400 without webhook uri', async () => {
    const res = await request(server).post('/webhooks');
    expect(res.status).toEqual(400);
  });

  it('should generate webhook successfully', async () => {
    const webhook = 'http://test.com';
    const res = await request(server).post('/webhooks').send({ webhook });
    expect(res.status).toEqual(200);
    const webhookUri = res.body.webhookUri;
    const rcWebhookRecord = await RCWebhook.findByPk(webhook);
    const bugsnagWebhookRecord = await Webhook.findByPk(rcWebhookRecord.bugsnag_webhook_id);
    expect(bugsnagWebhookRecord.rc_webhook).toEqual(webhook);
    expect(`${process.env.APP_SERVER}/notify/${bugsnagWebhookRecord.id}`).toEqual(webhookUri);
  });

  it('should reuse old webhook', async () => {
    const webhook = 'http://test.com';
    const existedRCWebhookRecord = await RCWebhook.findByPk(webhook);
    const res = await request(server).post('/webhooks').send({ webhook });
    expect(res.status).toEqual(200);
    const webhookUri = res.body.webhookUri;
    expect(`${process.env.APP_SERVER}/notify/${existedRCWebhookRecord.bugsnag_webhook_id}`).toEqual(webhookUri);
  });
});
