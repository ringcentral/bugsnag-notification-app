const request = require('supertest');
const { server } = require('../src/server');
const { Webhook } = require('../src/server/models/webhook');
const { RCWebhook } = require('../src/server/models/rc-webhook');

describe('Webhook new', () => {
  it('should get 404 without webhook uri', async () => {
    const res = await request(server).get('/webhook/new');
    expect(res.status).toEqual(404);
  });

  it('should get new webhook page successfully', async () => {
    const res = await request(server).get('/webhook/new?webhook=http://test.com/webhook_id');
    expect(res.status).toEqual(200);
    expect(res.header['content-security-policy']).toContain("frame-ancestors 'self'");
  });
});

describe('Webhook generate', () => {
  it('should get 403 without referer', async () => {
    const res = await request(server).post('/webhooks');
    expect(res.status).toEqual(403);
    expect(res.text).toEqual('No Referer');
  });

  it('should get 403 with wrong referer', async () => {
    const res = await request(server)
      .post('/webhooks')
      .set('Referer', 'http://test.com');
    expect(res.status).toEqual(403);
    expect(res.text).toEqual('Invalid Referer');
  });

  it('should get 400 without webhook uri', async () => {
    const res = await request(server).post('/webhooks').set('Referer', process.env.APP_SERVER);
    expect(res.status).toEqual(400);
  });

  it('should generate webhook successfully', async () => {
    const webhookId = 'webhook_id';
    const webhook = `http://test.com/${webhookId}`;
    const res = await request(server).post('/webhooks').send({ webhook }).set('Referer', process.env.APP_SERVER);
    expect(res.status).toEqual(200);
    const webhookUri = res.body.webhookUri;
    const rcWebhookRecord = await RCWebhook.findByPk(webhookId);
    const bugsnagWebhookRecord = await Webhook.findByPk(rcWebhookRecord.bugsnag_webhook_id);
    expect(bugsnagWebhookRecord.rc_webhook).toEqual(webhook);
    expect(`${process.env.APP_SERVER}/notify/${bugsnagWebhookRecord.id}`).toEqual(webhookUri);
  });

  it('should reuse old webhook', async () => {
    const webhookId = 'webhook_id';
    const webhook = `http://test.com/${webhookId}`;
    const existedRCWebhookRecord = await RCWebhook.findByPk(webhookId);
    const res = await request(server).post('/webhooks').send({ webhook }).set('Referer', process.env.APP_SERVER);
    expect(res.status).toEqual(200);
    const webhookUri = res.body.webhookUri;
    expect(`${process.env.APP_SERVER}/notify/${existedRCWebhookRecord.bugsnag_webhook_id}`).toEqual(webhookUri);
  });
});
