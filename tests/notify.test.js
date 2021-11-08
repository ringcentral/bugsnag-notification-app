const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const { server } = require('../src/server');
const { Webhook } = require('../src/app/models/webhook');
const { RCWebhook } = require('../src/app/models/rc-webhook');

const repeatedErrorData = require('../example-payload/repeated-error.json');
const releaseData = require('../example-payload/release.json');
const commentData = require('../example-payload/comment.json');
const collaboratorFixedData = require('../example-payload/collaborator-fixed.json');

axios.defaults.adapter = require('axios/lib/adapters/http')

async function getRequestBody(scope) {
  return new Promise((resolve, reject) => {
    scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
      resolve(requestBody);
    });
  });
}

describe('Notify', () => {
  const webhook = 'http://test.com/webhook/12121';
  let bugsnagWebhookRecord;

  beforeAll(async () => {
    await request(server).post('/webhooks').send({ webhook });
    const rcWebhookRecord = await RCWebhook.findByPk(webhook);
    bugsnagWebhookRecord = await Webhook.findByPk(rcWebhookRecord.bugsnag_webhook_id);
  });

  it('should get 404 with wrong webhook id', async () => {
    const res = await request(server).post('/notify/1234');
    expect(res.status).toEqual(404);
  });

  it('should get 200 with error message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(repeatedErrorData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with error message at v2', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify_v2/${bugsnagWebhookRecord.id}`)
      .send(repeatedErrorData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with release message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(releaseData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with comment message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(commentData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with collaborator message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(collaboratorFixedData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });
});
