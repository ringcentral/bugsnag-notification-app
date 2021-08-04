const path = require('path');
const axios = require('axios');
const { Bugsnag } = require('./utils/bugsnag');
const { Webhook } = require('./models/webhook');
const { AuthToken } = require('./models/authToken');

const { formatAdaptiveCardMessage, createAuthTokenRequestCard } = require('./utils/formatAdaptiveCardMessage');
const { formatGlipMessage } = require('./utils/formatGlipMessage');

exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');
  app.post('/notify/:id', async (req, res) => {
    const id = req.params.id;
    const webhookRecord = await Webhook.findByPk(id);
    if (!webhookRecord) {
      res.send('Not found');
      res.status(404);
      return;
    }
    const body = req.body;
    // console.log(JSON.stringify(body, null, 2));
    const message = formatGlipMessage(body);
    // console.log(JSON.stringify(message, null, 2));
    await axios.post(webhookRecord.rc_webhook, message, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    res.send('ok');
  });
  // V2 API for adaptive cards
  app.post('/notify_v2/:id', async (req, res) => {
    const id = req.params.id;
    const webhookRecord = await Webhook.findByPk(id);
    if (!webhookRecord) {
      res.send('Not found');
      res.status(404);
      return;
    }
    const body = req.body;
    // console.log(JSON.stringify(body, null, 2));
    const message = formatAdaptiveCardMessage(body, id);
    // console.log(JSON.stringify(message, null, 2));
    await axios.post(webhookRecord.rc_webhook, message, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    res.send('ok');
  });

  app.post('/interactive-messages', async (req, res) => {
    const body = req.body;
    if (!body.data || !body.user) {
      res.send('Params error');
      res.status(400);
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
      res.send('ok');
      return;
    }
    const webhookId = body.data.webhookId;
    const webhookRecord = await Webhook.findByPk(webhookId);
    if (!webhookRecord) {
      res.send('Not found');
      res.status(404);
      return;
    }
    if (!authToken || !authToken.data || authToken.data.length == 0) {
      await axios.post(webhookRecord.rc_webhook, createAuthTokenRequestCard(), {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
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
    } catch (e) {
      if (e.response) {
        if (e.response.status === 401) {
          authToken.data = '';
          await authToken.save();
          await axios.post(webhookRecord.rc_webhook, createAuthTokenRequestCard(), {
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json'
            }
          });
        } else if (e.response.status === 403) {
          await axios.post(webhookRecord.rc_webhook, {
            title: `Hi ${body.user.firstName}, your Bugsnag role doesn't have permission to perform this action.`,
          }, {
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
    res.send('ok');
  });

  app.get('/webhook/new', async (req, res) => {
    const glipWebhookUri = req.query.webhook;
    if (!glipWebhookUri || glipWebhookUri.indexOf('https://') !== 0) {
      res.send('Webhook uri is required.');
      res.status(404);
      return;
    }
    res.render('new', {
      glipWebhookUri,
    });
  });

  app.post('/webhooks', async (req, res) => {
    const glipWebhookUri = req.body.webhook;
    if (!glipWebhookUri || glipWebhookUri.indexOf('https://') !== 0) {
      res.send('Params error');
      res.status(400);
      return;
    }
    try {
      if (Webhook.getOne) {
        const webhookRecords = await Webhook.getOne({
          where: {
            rc_webhook: glipWebhookUri,
          }
        });
        webhookRecord = webhookRecords[0];
      } else {
        webhookRecord = await Webhook.findOne({
          where: {
            rc_webhook: glipWebhookUri,
          }
        });
      }
      if (!webhookRecord) {
        webhookRecord = await Webhook.create({
          rc_webhook: glipWebhookUri,
        });
      }
    } catch (e) {
      console.error(e);
      res.send('Internal server error');
      res.end(500);
      return;
    }
    res.json({
      webhookUri: `${process.env.APP_SERVER}/notify/${webhookRecord.id}`,
    });
  });
}
