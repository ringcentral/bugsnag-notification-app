const request = require('supertest');
const nock = require('nock');
const axios = require('axios');
const { default: Bot } = require('ringcentral-chatbot-core/dist/models/bot');

const { findItemInAdaptiveCard } = require('../src/server/utils/adaptiveCardHelper');

const { server } = require('../src/server');
const repeatedErrorData = require('../example-payload/repeated-error.json');
const releaseData = require('../example-payload/release.json');
const commentData = require('../example-payload/comment.json');
const collaboratorFixedData = require('../example-payload/collaborator-fixed.json');

axios.defaults.adapter = require('axios/lib/adapters/http');

describe('Bot', () => {
  const botId = '266262004';
  const groupId = '713297005';
  let subscribeUrl;

  it('should install bot successfully', async () => {
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
    const res = await request(server).get('/bot/oauth?code=xxxxxx&client_id=xxxxxx');
    expect(res.status).toBe(200);
    const bot = await Bot.findByPk(botId);
    expect(bot.id).toEqual(botId);
    rcWebhookScope.done();
    rcTokenScope.done();
  });

  it('should send help card when bot join a new group', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/bot/webhook').send({
      "uuid": "54666613415546054",
      "event": "/restapi/v1.0/glip/groups",
      "timestamp": "2022-02-11T09:42:57.811Z",
      "subscriptionId": "0a7fb1f2-9e7c-456f-8078-148d1e7c3638",
      "ownerId": botId,
      "body": {
        "id": groupId,
        "name": "Bot test",
        "description": null,
        "type": "Team",
        "status": "Active",
        "members": [
          "170848004",
          "170853004",
          "713297005"
        ],
        "isPublic": false,
        "creationTime": "2022-02-08T09:02:59.677Z",
        "lastModifiedTime": "2022-02-11T09:42:57.471Z",
        "eventType": "GroupJoined"
      }
    });
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('I am Bugsnag Bot');
    rcCardScope.done();
  });

  it('should send help card when bot get help command', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    const rcGroupScope = nock(process.env.RINGCENTRAL_SERVER)
      .get(uri => uri.includes(`/restapi/v1.0/glip/groups/${groupId}`))
      .reply(200, {
        id: groupId,
        members: [
          "170848004",
          "170853004",
          "713297005"
        ]
      });
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/bot/webhook').send({
      "uuid": "5794186355105264737",
      "event": "/restapi/v1.0/glip/posts",
      "timestamp": "2022-02-11T09:49:55.091Z",
      "subscriptionId": "0a7fb1f2-9e7c-456f-8078-148d1e7c3638",
      "ownerId": botId,
      "body": {
        "id": "5852045316",
        "groupId": groupId,
        "type": "TextMessage",
        "text": `![:Person](${botId}) help`,
        "creatorId": "170848004",
        "addedPersonIds": null,
        "creationTime": "2022-02-11T09:49:54.614Z",
        "lastModifiedTime": "2022-02-11T09:49:54.614Z",
        "attachments": null,
        "activity": null,
        "title": null,
        "iconUri": null,
        "iconEmoji": null,
        "mentions": [
          {
            "id": botId,
            "type": "Person",
            "name": "Bugsnag Bot"
          }
        ],
        "eventType": "PostAdded"
      }
    });
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('I am Bugsnag Bot');
    rcCardScope.done();
    rcGroupScope.done();
  });

  it('should send authorize card when bot get authorize command', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    const rcGroupScope = nock(process.env.RINGCENTRAL_SERVER)
      .get(uri => uri.includes(`/restapi/v1.0/glip/groups/${groupId}`))
      .reply(200, {
        id: groupId,
        members: [
          "170848004",
          "170853004",
          "713297005"
        ]
      });
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/bot/webhook').send({
      "uuid": "5794186355105264737",
      "event": "/restapi/v1.0/glip/posts",
      "timestamp": "2022-02-11T09:49:55.091Z",
      "subscriptionId": "0a7fb1f2-9e7c-456f-8078-148d1e7c3638",
      "ownerId": botId,
      "body": {
        "id": "5852045316",
        "groupId": groupId,
        "type": "TextMessage",
        "text": `![:Person](${botId}) authorize`,
        "creatorId": "170848004",
        "addedPersonIds": null,
        "creationTime": "2022-02-11T09:49:54.614Z",
        "lastModifiedTime": "2022-02-11T09:49:54.614Z",
        "attachments": null,
        "activity": null,
        "title": null,
        "iconUri": null,
        "iconEmoji": null,
        "mentions": [
          {
            "id": botId,
            "type": "Person",
            "name": "Bugsnag Bot"
          }
        ],
        "eventType": "PostAdded"
      }
    });
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('input your Bugsnag personal auth token');
    rcCardScope.done();
    rcGroupScope.done();
  });

  it('should send unauthorize card when bot get unauthorize command', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    const rcGroupScope = nock(process.env.RINGCENTRAL_SERVER)
      .get(uri => uri.includes(`/restapi/v1.0/glip/groups/${groupId}`))
      .reply(200, {
        id: groupId,
        members: [
          "170848004",
          "170853004",
          "713297005"
        ]
      });
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/bot/webhook').send({
      "uuid": "5794186355105264737",
      "event": "/restapi/v1.0/glip/posts",
      "timestamp": "2022-02-11T09:49:55.091Z",
      "subscriptionId": "0a7fb1f2-9e7c-456f-8078-148d1e7c3638",
      "ownerId": botId,
      "body": {
        "id": "5852045316",
        "groupId": groupId,
        "type": "TextMessage",
        "text": `![:Person](${botId}) unauthorize`,
        "creatorId": "170848004",
        "addedPersonIds": null,
        "creationTime": "2022-02-11T09:49:54.614Z",
        "lastModifiedTime": "2022-02-11T09:49:54.614Z",
        "attachments": null,
        "activity": null,
        "title": null,
        "iconUri": null,
        "iconEmoji": null,
        "mentions": [
          {
            "id": botId,
            "type": "Person",
            "name": "Bugsnag Bot"
          }
        ],
        "eventType": "PostAdded"
      }
    });
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('Are you sure to remove your Bugsnag personal auth token');
    rcCardScope.done();
    rcGroupScope.done();
  });

  it('should send subscribe card when bot get subscribe command', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    const rcGroupScope = nock(process.env.RINGCENTRAL_SERVER)
      .get(uri => uri.includes(`/restapi/v1.0/glip/groups/${groupId}`))
      .reply(200, {
        id: groupId,
        members: [
          "170848004",
          "170853004",
          "713297005"
        ]
      });
    let requestBody = null;
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post('/bot/webhook').send({
      "uuid": "5794186355105264737",
      "event": "/restapi/v1.0/glip/posts",
      "timestamp": "2022-02-11T09:49:55.091Z",
      "subscriptionId": "0a7fb1f2-9e7c-456f-8078-148d1e7c3638",
      "ownerId": botId,
      "body": {
        "id": "5852045316",
        "groupId": groupId,
        "type": "TextMessage",
        "text": `![:Person](${botId}) subscribe`,
        "creatorId": "170848004",
        "addedPersonIds": null,
        "creationTime": "2022-02-11T09:49:54.614Z",
        "lastModifiedTime": "2022-02-11T09:49:54.614Z",
        "attachments": null,
        "activity": null,
        "title": null,
        "iconUri": null,
        "iconEmoji": null,
        "mentions": [
          {
            "id": botId,
            "type": "Person",
            "name": "Bugsnag Bot"
          }
        ],
        "eventType": "PostAdded"
      }
    });
    subscribeUrl = findItemInAdaptiveCard(requestBody, 'subscribeUrl').text;
    expect(res.status).toEqual(200);
    expect(subscribeUrl).toContain(process.env.RINGCENTRAL_CHATBOT_SERVER);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('setup your Bugsnag project');
    rcCardScope.done();
    rcGroupScope.done();
  });

  it('should redirect bugsnag error message to rc group by bot', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post(subscribeUrl.replace(process.env.RINGCENTRAL_CHATBOT_SERVER, '')).send(repeatedErrorData);
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('Repeated error');
  });

  it('should redirect bugsnag release message to rc group by bot', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post(subscribeUrl.replace(process.env.RINGCENTRAL_CHATBOT_SERVER, '')).send(releaseData);
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('New release');
  });

  it('should redirect bugsnag comment message to rc group by bot', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post(subscribeUrl.replace(process.env.RINGCENTRAL_CHATBOT_SERVER, '')).send(commentData);
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('commented on');
  });

  it('should redirect bugsnag collaborator message to rc group by bot', async () => {
    const rcCardScope = nock(process.env.RINGCENTRAL_SERVER)
      .post(uri => uri.includes(`/restapi/v1.0/glip/chats/${groupId}/adaptive-cards`))
      .reply(200, {});
    rcCardScope.once('request', ({ headers: requestHeaders }, interceptor, reqBody) => {
      requestBody = JSON.parse(reqBody);
    });
    const res = await request(server).post(subscribeUrl.replace(process.env.RINGCENTRAL_CHATBOT_SERVER, '')).send(collaboratorFixedData);
    expect(res.status).toEqual(200);
    expect(requestBody.type).toContain('AdaptiveCard');
    expect(requestBody.fallbackText).toContain('fixed');
  });
});
