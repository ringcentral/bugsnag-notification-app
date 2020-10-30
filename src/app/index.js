const path = require('path');
const axios = require('axios');
const { Webhook } = require('./models/webhook');
const cookieSession = require('cookie-session');

const { formatGlipMessage } = require('./utils/formatGlipMessage');
const { formatTeamsMessage } = require('./utils/formatAdaptiveCardMessage');

exports.appExtend = (app) => {
  app.set('views', path.resolve(__dirname, './views'));
  app.set('view engine', 'pug');
  // cookie session config
  app.use(cookieSession({
    name: 'session',
    keys: [process.env.APP_SERVER_SECRET_KEY],
    httpOnly: true,
    signed: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }));
  app.post('/notify/:id', async (req, res) => {
    const id = req.params.id;
    const webhookRecord = await Webhook.findByPk(id);
    if (!webhookRecord) {
      res.end(404);
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

  app.post('/teams/:id', async (req, res) => {
    const id = req.params.id;
    const webhookRecord = await Webhook.findByPk(id);
    if (!webhookRecord) {
      res.end(404);
      return;
    }
    const body = req.body;
    // console.log(JSON.stringify(body, null, 2));
    const message = formatTeamsMessage(body);
    // console.log(JSON.stringify(message, null, 2));
    await axios.post(webhookRecord.rc_webhook, message, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    res.send('ok');
  });

  app.get('/webhook/new', async (req, res) => {
    const csrfToken = Math.random().toString(36);
    req.session.csrfToken = csrfToken;
    const glipWebhookUri = req.query.webhook;
    let webhookRecord = {};
    if (glipWebhookUri) {
      try {
        const webhookRecords = await Webhook.findAll({
          where: {
            rc_webhook: glipWebhookUri,
          }
        });
        webhookRecord = webhookRecords[0];
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
    }
    let authToken = webhookRecord.bs_auth_token || '';
    if (authToken && authToken.length > 0) {
      authToken = (new Array(authToken.length)).fill('*').join('');
    }
    res.render('new', {
      webhookUri: `${process.env.APP_SERVER}/notify/${webhookRecord.id}`,
      webhookId: webhookRecord.id,
      authToken,
      csrfToken,
    });
  });

  app.post('/webhook/:id', async (req, res) => {
    const id = req.params.id;
    if (!id) {
      res.end(404);
      return;
    }
    const csrf = req.query._csrf;
    if (!csrf || csrf !== req.session.csrfToken) {
      res.end(403);
      return;
    }
    const webhookRecord = await Webhook.findByPk(id);
    if (!webhookRecord) {
      res.end(404);
      return;
    }
    webhookRecord.bs_auth_token = req.body.authToken;
    await webhookRecord.save();
    res.send({ result: 'ok' });
    res.end(200);
  });
}
