const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { requestWithoutWaitingResponse } = require('./utils/requestWithoutWaitingResponse');
const { Bugsnag } = require('./utils/bugsnag');
const { Webhook } = require('./models/webhook');
const { RCWebhook } = require('./models/rc-webhook');
const { AuthToken } = require('./models/authToken');

const {
  formatAdaptiveCardMessage,
  createAuthTokenRequestCard,
  createMessageCard,
} = require('./utils/formatAdaptiveCardMessage');

// V2 API for adaptive cards
const notifyV2 = async (req, res) => {
  const id = req.params.id;
  const time = Date.now();
  const webhookRecord = await Webhook.findByPk(id);
  const dbQueryTime = Date.now();
  console.log('DB query time:', dbQueryTime - time);
  if (!webhookRecord) {
    res.status(404);
    res.send('Not found');
    return;
  }
  const body = req.body;
  // console.log(JSON.stringify(body, null, 2));
  const message = formatAdaptiveCardMessage(body, id);
  // console.log(JSON.stringify(message.attachments[0], null, 2));
  await requestWithoutWaitingResponse(webhookRecord.rc_webhook, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message)
  });
  const requestTime = Date.now();
  console.log('RC webhook request time:', requestTime - dbQueryTime);
  res.status(200);
  res.send('ok');
};

exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');
  app.post('/notify/:id', notifyV2);
  app.post('/notify_v2/:id', notifyV2);

  app.post('/interactive-messages', async (req, res) => {
    const SHARED_SECRET = process.env.INTERACTIVE_MESSAGES_SHARED_SECRET;
    if (SHARED_SECRET) {
      const signature = req.get('X-Glip-Signature', 'sha1=');
      const encryptedBody =
        crypto.createHmac('sha1', SHARED_SECRET).update(JSON.stringify(req.body)).digest('hex');
      if (encryptedBody !== signature) {
        res.status(401).send();
        return;
      }
    }
    const body = req.body;
    // console.log(JSON.stringify(body, null, 2));
    if (!body.data || !body.user) {
      res.status(400);
      res.send('Params error');
      return;
    }
    const webhookId = body.data.webhookId;
    const webhookRecord = await Webhook.findByPk(webhookId);
    if (!webhookRecord) {
      res.status(404);
      res.send('Not found');
      return;
    }
    let authToken = await AuthToken.findByPk(`${body.user.accountId}-${body.user.id}`);
    const action = body.data.action;
    if (action === 'saveAuthToken') {
      if (authToken) {
        authToken.data = body.data.token;
        await authToken.save();
      } else {
        authToken = await AuthToken.create({
          id: `${body.user.accountId}-${body.user.id}`,
          data: body.data.token,
        });
      }
      await axios.post(webhookRecord.rc_webhook, createMessageCard({
        message: `Hi ${body.user.firstName} ${body.user.lastName}, your personal token is saved. Please click action button again.`
      }), {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      res.status(200);
      res.send('ok');
      return;
    }
    if (!authToken || !authToken.data || authToken.data.length == 0) {
      await axios.post(webhookRecord.rc_webhook,
        createAuthTokenRequestCard({ webhookId }),
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      res.status(200);
      res.send('ok');
      return;
    }
    const bugsnag = new Bugsnag({
      authToken: authToken.data,
      projectId: body.data.projectId,
      errorId: body.data.errorId,
    });
    try {
      if (action === 'fix') {
        await bugsnag.makeAsFixed();
      }
      if (action === 'ignore') {
        await bugsnag.ignore();
      }
      if (action === 'snooze') {
        await bugsnag.snooze({ type: body.data.snoozeType });
      }
      if (action === 'open') {
        await bugsnag.open();
      }
      const comment = (
        body.data.fixComment ||
        body.data.snoozeComment ||
        body.data.ignoreComment ||
        body.data.openComment ||
        body.data.comment
      );
      if (comment) {
        await bugsnag.comment({ message: comment });
      }
    } catch (e) {
      if (e.response) {
        if (e.response.status === 401) {
          authToken.data = '';
          await authToken.save();
          await axios.post(webhookRecord.rc_webhook, createAuthTokenRequestCard({ webhookId }), {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else if (e.response.status === 403) {
          await axios.post(webhookRecord.rc_webhook, createMessageCard({
            message: `Hi ${body.user.firstName}, your Bugsnag role doesn't have permission to perform this action.`,
          }), {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
      } else {
        console.error(e);
      }
    }
    res.status(200);
    res.send('ok');
  });

  app.get('/webhook/new', async (req, res) => {
    const glipWebhookUri = req.query.webhook;
    if (
      !glipWebhookUri ||
      (
        glipWebhookUri.indexOf('https://') !== 0 &&
        glipWebhookUri.indexOf('http://') !== 0
      )
    ) {
      res.status(404);
      res.send('Webhook uri is required.');
      return;
    }
    res.render('new', {
      glipWebhookUri,
    });
  });

  app.post('/webhooks', async (req, res) => {
    const rcWebhookUri = req.body.webhook;
    if (
      !rcWebhookUri ||
      (
        rcWebhookUri.indexOf('https://') !== 0 &&
        rcWebhookUri.indexOf('http://') !== 0
      )) {
      res.status(400);
      res.send('Params error');
      return;
    }
    let rcWebhook;
    let bugsnagWebhook;
    try {
      // We split RCWebhook and Webhook for querying in dynamodb
      rcWebhook = await RCWebhook.findByPk(rcWebhookUri);
      if (rcWebhook) {
        bugsnagWebhook = await Webhook.findByPk(rcWebhook.bugsnag_webhook_id);
      } else {
        rcWebhook = await RCWebhook.create({
          id: rcWebhookUri,
        });
      }
      if (!bugsnagWebhook) {
        bugsnagWebhook = await Webhook.create({
          rc_webhook: rcWebhookUri,
        });
        rcWebhook.bugsnag_webhook_id = bugsnagWebhook.id;
        await rcWebhook.save();
      }
      res.json({
        webhookUri: `${process.env.APP_SERVER}/notify/${bugsnagWebhook.id}`,
      });
    } catch (e) {
      console.error(e);
      res.status(500);
      res.send('Internal server error');
      return;
    }
  });
}
