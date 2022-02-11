const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const { server } = require('../src/server');

const { RCWebhook } = require('../src/server/models/rc-webhook');
const { Webhook } = require('../src/server/models/webhook');
const { AuthToken } = require('../src/server/models/authToken');

axios.defaults.adapter = require('axios/lib/adapters/http');

describe('Notification Interactive Messages', () => {
  const rcWebhookId = '12121';
  const rcWebhookUri = `http://test.com/webhook/${rcWebhookId}`;
  let webhookRecord;

  beforeAll(async () => {
    const rcWebhookRecord = await await RCWebhook.create({
      id: rcWebhookId,
    });
    webhookRecord = await Webhook.create({
      id: rcWebhookRecord.bugsnag_webhook_id,
      rc_webhook: rcWebhookUri,
    });
  });

  it('should get 400 with wrong body params', async () => {
    const res = await request(server).post('/interactive-messages');
    expect(res.status).toEqual(400);
    const res1 = await request(server).post('/interactive-messages').send({ data: {} });
    expect(res1.status).toEqual(400);
    const res2 = await request(server).post('/interactive-messages').send({ data: {}, user: {} });
    expect(res2.status).toEqual(400);
  });

  it('should get 404 with wrong webhookId', async () => {
    const res1 = await request(server)
      .post('/interactive-messages')
      .send({
        data: { webhookId: 'whatever' },
        user: {},
        conversation: {},
      });
    expect(res1.status).toEqual(404);
  });

  it('should get 401 with INTERACTIVE_MESSAGES_SHARED_SECRET and wrong signature', async () => {
    process.env.INTERACTIVE_MESSAGES_SHARED_SECRET = 'test-secret';
    const res = await request(server).post('/interactive-messages').send({
      data: {},
      user: {},
      conversation: {},
    });
    delete process.env.INTERACTIVE_MESSAGES_SHARED_SECRET;
    expect(res.status).toEqual(401);
  });

  it('should send auth card with new rc user', async () => {
    const scope = nock('http://test.com')
      .post(`/webhook/${rcWebhookId}`)
      .reply(200, { result: 'OK' });
    let requestBody = null;
    scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id
      },
      user: {
        id: 'test-user-id',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    expect(JSON.stringify(requestBody.attachments[0])).toContain('Submit');
    expect(JSON.stringify(requestBody.attachments[0])).toContain(webhookRecord.id);
    scope.done();
  });

  it('should send auth card with existing auth token', async () => {
    const scope = nock('http://test.com')
      .post(`/webhook/${rcWebhookId}`)
      .reply(200, { result: 'OK' });
    let requestBody = null;
    scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    await AuthToken.create({
      id: 'test-account-id-test-user-id',
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    expect(JSON.stringify(requestBody.attachments[0])).toContain('Submit');
    expect(JSON.stringify(requestBody.attachments[0])).toContain(webhookRecord.id);
    scope.done();
  });

  it('should create auth token successfully when new user submit token', async () => {
    const scope = nock('http://test.com')
      .post(`/webhook/${rcWebhookId}`)
      .reply(200, { result: 'OK' });
    let requestBody = null;
    scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'saveAuthToken',
        token: 'test-token',
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(requestBody.title).toContain('token is saved');
    const authToken = await AuthToken.findByPk('test-account-id-test-user-id');
    expect(authToken.data).toEqual('test-token');
    scope.done();
  });

  it('should save auth token successfully when old user submit token', async () => {
    const scope = nock('http://test.com')
      .post(`/webhook/${rcWebhookId}`)
      .reply(200, { result: 'OK' });
    let requestBody = null;
    scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    let authToken = await AuthToken.findByPk('test-account-id-test-user-id');
    expect(!!authToken.data).toEqual(true);
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'saveAuthToken',
        token: 'test-token-2',
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(requestBody.title).toContain('token is saved');
    authToken = await AuthToken.findByPk('test-account-id-test-user-id');
    expect(authToken.data).toEqual('test-token-2');
    scope.done();
  });

  it('should make error into fixed successfully', async () => {
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'fix',
        projectId,
        errorId,
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.operation).toEqual('fix');
    bugsnagScope.done();
  });

  it('should make error into ignored successfully', async () => {
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'ignore',
        projectId,
        errorId,
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.operation).toEqual('ignore');
    bugsnagScope.done();
  });

  it('should make error into reopened successfully', async () => {
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'open',
        projectId,
        errorId,
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.operation).toEqual('open');
    bugsnagScope.done();
  });

  it('should make error into snoozed with type successfully', async () => {
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'snooze',
        snoozeType: '1hr',
        projectId,
        errorId,
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.operation).toEqual('snooze');
    expect(bugsnagRequestBody.reopen_rules.reopen_if).toEqual('occurs_after');
    expect(bugsnagRequestBody.reopen_rules.seconds).toEqual(3600);
    bugsnagScope.done();
  });

  it('should send comment to bugsnag successfully', async () => {
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .post(uri => uri.includes(`/projects/${projectId}/errors/${errorId}/comments`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'comment',
        comment: 'test_comment',
        projectId,
        errorId,
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.message).toEqual('test_comment');
    bugsnagScope.done();
  });

  it('should send role issue message when Bugnsnag response with 403', async () => {
    const scope = nock('http://test.com')
      .post(`/webhook/${rcWebhookId}`)
      .reply(200, { result: 'OK' });
    let requestBody = null;
    scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const projectId = 'test-project-id-1';
    const errorId = 'test-error-id-1';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(403, {});
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'fix',
        projectId,
        errorId,
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(requestBody.title).toContain("your Bugsnag role doesn't have permission");
    scope.done();
    bugsnagScope.done();
  });

  it('should send auth card when Bugnsnag response with 401', async () => {
    const scope = nock('http://test.com')
      .post(`/webhook/${rcWebhookId}`)
      .reply(200, { result: 'OK' });
    let requestBody = null;
    scope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(401, {});
    const res = await request(server).post('/interactive-messages').send({
      data: {
        webhookId: webhookRecord.id,
        action: 'fix',
        projectId,
        errorId,
      },
      user: {
        accountId: 'test-account-id',
        id: 'test-user-id',
        firstName: 'test-user-first-name',
        lastName: 'test-user-last-name',
      },
      conversation: {},
    });
    expect(res.status).toEqual(200);
    expect(requestBody.attachments[0].type).toContain('AdaptiveCard');
    expect(JSON.stringify(requestBody.attachments[0])).toContain('input your Bugsnag personal auth token');
    scope.done();
    bugsnagScope.done();
  });
});
