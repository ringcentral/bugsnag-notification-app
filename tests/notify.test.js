const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const { server } = require('../src/server');
const { Webhook } = require('../src/server/models/webhook');
const { RCWebhook } = require('../src/server/models/rc-webhook');

const repeatedErrorData = require('../example-payload/repeated-error.json');
const powerTenErrorData = require('../example-payload/power-ten-error.json');
const releaseData = require('../example-payload/release.json');
const commentData = require('../example-payload/comment.json');
const collaboratorFixedData = require('../example-payload/collaborator-fixed.json');
const collaboratorReopenedData = require('../example-payload/collaborator-reopened.json');
const collaboratorSnoozedAffectedUsersData = require('../example-payload/collaborator-snoozed-affected_users.json');
const collaboratorSnoozedAfterData = require('../example-payload/collaborator-snoozed-after.json');
const collaboratorSnoozedCanceledData = require('../example-payload/collaborator-snoozed-canceled.json');
const collaboratorSnoozedOccurrencesData = require('../example-payload/collaborator-snoozed-occurrences.json');
const collaboratorSnoozedPerHourData = require('../example-payload/collaborator-snoozed-per-hour.json');

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

  it('should get 200 with powerTen error message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(powerTenErrorData);
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

  it('should get 200 with collaborator fixed message', async () => {
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

  it('should get 200 with collaborator reopened message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(collaboratorReopenedData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with collaborator snoozed affected users message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(collaboratorSnoozedAffectedUsersData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with collaborator snoozed after message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(collaboratorSnoozedAfterData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with collaborator snoozed cancelled message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(collaboratorSnoozedCanceledData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with collaborator snoozed occurrences message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(collaboratorSnoozedOccurrencesData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });

  it('should get 200 with collaborator snoozed per hour message', async () => {
    const scope = nock('http://test.com')
      .post('/webhook/12121')
      .reply(200, { result: 'OK' });
    const requestBodyPromise = getRequestBody(scope);
    const res = await request(server)
      .post(`/notify/${bugsnagWebhookRecord.id}`)
      .send(collaboratorSnoozedPerHourData);
    expect(res.status).toEqual(200);
    const requestBody = await requestBodyPromise;
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    scope.done();
  });
});
