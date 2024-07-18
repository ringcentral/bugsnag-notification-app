const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const { AuthToken } = require('../src/server/models/authToken');

const { server } = require('../src/server');

const errorCardMock = require('./mock-data/error-card.json');
const commentCardMock = require('./mock-data/comment-card.json');

const { getRequestBody } = require('./utils');

axios.defaults.adapter = 'http';

describe('Bot', () => {
  const botId = '266262004';
  const groupId = '713297005';

  beforeAll(async () => {
    const rcTokenScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes('/restapi/oauth/token'))
      .reply(200, {
        access_token: 'xxxxxx',
        token_type: 'bearer',
        expires_in: 2147483647,
        scope: 'SubscriptionWebhook TeamMessing ReadAccounts',
        owner_id: botId,
        endpoint_id: 'p7GZlEVHRwKDwbx6UkH0YQ'
      });
    const rcWebhookScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes('/restapi/v1.0/subscription'))
      .reply(200, {});
    await request(server).get(`/bot/oauth?code=xxxxxx&client_id=xxxxxx&creator_extension_id=${botId}&creator_account_id=1234`);
    rcTokenScope.done();
    rcWebhookScope.done();
  });

  it('should get 404 without card in body', async () => {
    const res1 = await request(server)
      .post('/interactive-messages')
      .send({
        data: { botId: 'whatever', messageType: 'Bot' },
        user: {},
        conversation: {},
      });
    expect(res1.status).toEqual(400);
  });

  it('should get 401 with RINGCENTRAL_CHATBOT_INTERACTIVE_MESSAGES_SHARED_SECRET and wrong signature', async () => {
    process.env.RINGCENTRAL_CHATBOT_INTERACTIVE_MESSAGES_SHARED_SECRET = 'test-secret';
    const res = await request(server).post('/interactive-messages').send({
      data: { messageType: 'Bot' },
      user: {},
      conversation: {},
      card: {},
    });
    delete process.env.RINGCENTRAL_CHATBOT_INTERACTIVE_MESSAGES_SHARED_SECRET;
    expect(res.status).toEqual(401);
  });

  it('should get 404 with wrong botId', async () => {
    const res1 = await request(server)
      .post('/interactive-messages')
      .send({
        data: { botId: 'whatever', messageType: 'Bot' },
        user: {},
        conversation: {},
        card: {},
      });
    expect(res1.status).toEqual(404);
  });

  it('should send subscribe card with subscribe action', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'subscribe',
        },
        user: {},
        conversation: {
          id: groupId,
        },
        card: {},
      });
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('setup your Bugsnag project');
    rcCardScope.done();
  });

  it('should save auth token successfully with card updated', async () => {
    const cardId = 'test-card-id';
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .put(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, {});
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'saveAuthToken',
          token: 'test-token',
        },
        user: {
          accountId: 'test-account-id',
          id: 'test-user-id',
          extId: 'test-ext-id',
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    const authToken = await AuthToken.findByPk('test-account-id-test-user-id');
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(JSON.stringify(requestBody.body)).toContain('token is saved successfully');
    expect(authToken.getDecryptedData()).toEqual('test-token');
    rcCardScope.done();
  });

  it('should remove auth token successfully with card updated', async () => {
    const cardId = 'test-card-id';
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .put(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, {});
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'removeAuthToken',
        },
        user: {
          accountId: 'test-account-id',
          id: 'test-user-id',
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    const authToken = await AuthToken.findByPk('test-account-id-test-user-id');
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(JSON.stringify(requestBody.body)).toContain('token is removed successfully');
    expect(authToken.getDecryptedData()).toEqual('');
    rcCardScope.done();
  });

  it('should send auth card without auth token', async () => {
    const cardId = 'test-card-id';
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'fix',
        },
        user: {
          accountId: 'test-account-id',
          id: 'test-user-id',
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('input your Bugsnag personal auth token');
    rcCardScope.done();
  });

  it('should update error state fixed successfully with card updated', async () => {
    const userId = 'test-user-id-1';
    await AuthToken.create({
      id: `test-account-id-${userId}`,
      data: 'test_token',
    });
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const cardId = 'test-card-id-1';
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .put(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, {});
    const rcCardGetScope = nock(process.env.RINGCENTRAL_SERVER)
      .get(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, errorCardMock);

    const cardRequestBodyPromise = getRequestBody(rcCardScope);
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'fix',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.operation).toEqual('fix');
    const cardRequestBody = await cardRequestBodyPromise;
    expect(cardRequestBody.type).toContain('AdaptiveCard');
    expect(JSON.stringify(cardRequestBody.body)).toContain('Fixed');
    rcCardGetScope.done();
    bugsnagScope.done();
    rcCardScope.done();
  });

  it('should update error state snoozed successfully with card updated', async () => {
    const userId = 'test-user-id-1';
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const cardId = 'test-card-id-1';
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .put(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, {});
    const rcCardGetScope = nock(process.env.RINGCENTRAL_SERVER)
      .get(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, errorCardMock);

    const cardRequestBodyPromise = getRequestBody(rcCardScope);
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'snooze',
          snoozeType: '1hr',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.operation).toEqual('snooze');
    const cardRequestBody = await cardRequestBodyPromise;
    expect(cardRequestBody.type).toContain('AdaptiveCard');
    expect(JSON.stringify(cardRequestBody.body)).toContain('Snoozed');
    rcCardGetScope.done();
    bugsnagScope.done();
    rcCardScope.done();
  });

  it('should add comment successfully with card updated', async () => {
    const userId = 'test-user-id-1';
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .post(uri => uri.includes(`/projects/${projectId}/errors/${errorId}/comments`))
      .reply(200, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const cardId = 'test-card-id-2';
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .put(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, {});
    const rcCardGetScope = nock(process.env.RINGCENTRAL_SERVER)
      .get(uri => uri.includes(`/v1.0/glip/adaptive-cards/${cardId}`))
      .reply(200, commentCardMock);

    const cardRequestBodyPromise = getRequestBody(rcCardScope);
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'comment',
          comment: 'new comment',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    expect(bugsnagRequestBody.message).toEqual('new comment');
    const cardRequestBody = await cardRequestBodyPromise;
    expect(cardRequestBody.type).toContain('AdaptiveCard');
    expect(JSON.stringify(cardRequestBody.body)).toContain('new comment');
    rcCardGetScope.done();
    bugsnagScope.done();
    rcCardScope.done();
  });

  it('should send role issue when Bugnsnag response with 403', async () => {
    const userId = 'test-user-id-1';
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(403, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const cardId = 'test-card-id-1';
    const rcPostScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/groups/${groupId}/posts`))
      .reply(200, {});

    const postRequestBodyPromise = getRequestBody(rcPostScope);
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'fix',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    const postRequestBody = await postRequestBodyPromise;
    expect(postRequestBody.text).toContain("doesn't have permission");
    rcPostScope.done();
    bugsnagScope.done();
  });

  it('should send auth card when Bugnsnag response with 401', async () => {
    const userId = 'test-user-id-1';
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(401, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const cardId = 'test-card-id-1';
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'fix',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('input your Bugsnag personal auth token');
    rcCardScope.done();
    bugsnagScope.done();
  });

  it('should response 200 when Bugnsnag response with 404', async () => {
    const userId = 'test-user-id-1';
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(404, {});
    const cardId = 'test-card-id-1';
    const authToken = await AuthToken.findByPk('test-account-id-test-user-id-1');
    authToken.data = 'xxx';
    await authToken.save();
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'fix',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    bugsnagScope.done();
  });

  it('should response 200 when Bugnsnag response with network issue', async () => {
    const userId = 'test-user-id-1';
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .replyWithError("network issue");
    const cardId = 'test-card-id-1';
    const authToken = await AuthToken.findByPk('test-account-id-test-user-id-1');
    authToken.data = 'xxx';
    await authToken.save();
    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'fix',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(200);
    bugsnagScope.done();
  });

  it('should reply 500 when send no permission card error', async () => {
    const userId = 'test-user-id-1';
    const projectId = 'test-project-id';
    const errorId = 'test-error-id';
    const bugsnagScope = nock('https://api.bugsnag.com')
      .patch(uri => uri.includes(`/projects/${projectId}/errors/${errorId}`))
      .reply(403, {});
    let bugsnagRequestBody = null;
    bugsnagScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      bugsnagRequestBody = JSON.parse(reqBody);
    });
    const cardId = 'test-card-id-1';
    const rcPostScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/groups/${groupId}/posts`))
      .reply(500, {});

    const res = await request(server)
      .post('/interactive-messages')
      .send({
        data: {
          botId,
          messageType: 'Bot',
          action: 'fix',
          projectId,
          errorId,
        },
        user: {
          accountId: 'test-account-id',
          id: userId,
        },
        conversation: {
          id: groupId,
        },
        card: {
          id: cardId,
        },
      });
    expect(res.status).toEqual(500);
    rcPostScope.done();
    bugsnagScope.done();
  });
});
