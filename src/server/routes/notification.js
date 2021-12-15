const axios = require('axios');
const crypto = require('crypto');
const { requestWithoutWaitingResponse } = require('../utils/requestWithoutWaitingResponse');
const { Bugsnag } = require('../utils/bugsnag');
const { Webhook } = require('../models/webhook');
const { AuthToken } = require('../models/authToken');

const {
  formatAdaptiveCardMessage,
  createAuthTokenRequestCard,
  createMessageCard,
} = require('../utils/formatAdaptiveCardMessage');

// notification from bugsnag
async function notification(req, res) {
  const id = req.params.id;
  const webhookRecord = await Webhook.findByPk(id);
  if (!webhookRecord) {
    res.status(404);
    res.send('Not found');
    return;
  }
  const body = req.body;
  // console.log(JSON.stringify(body, null, 2));
  const message = formatAdaptiveCardMessage(body, id);
  // console.log(JSON.stringify(message.attachments[0], null, 2));
  // request without waiting response to reduce lambda function time
  await requestWithoutWaitingResponse(webhookRecord.rc_webhook, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(message),
  });
  res.status(200);
  res.send('ok');
};

// interactive messages from RingCentral
async function interactiveMessages(req, res) {
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
}

exports.notification = notification;
exports.interactiveMessages = interactiveMessages;
