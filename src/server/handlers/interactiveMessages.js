const axios = require('axios');
const Bot = require('ringcentral-chatbot-core/dist/models/bot').default;

const { Bugsnag } = require('../utils/bugsnag');
const { Webhook } = require('../models/webhook');
const { AuthToken } = require('../models/authToken');

const { generateToken } = require('../utils/jwt');
const { getAdaptiveCardFromTemplate } = require('../utils/getAdaptiveCardFromTemplate');
const subscribeCardTemplate = require('../adaptiveCards/subscribeCard.json');

const {
  createAuthTokenRequestCard,
  createMessageCard,
} = require('../utils/formatAdaptiveCardMessage');

async function notificationInteractiveMessages(req, res) {
  const body = req.body;
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

async function botInteractiveMessagesHandler(req, res) {
  const body = req.body;
  const groupId = body.conversation.id;
  try {
    const bot = await Bot.findByPk(body.data.botId);
    if (bot) {
      if (body.data.action === 'subscribe') {
        const notifyId = generateToken({ botId: body.data.botId, groupId });
        const subscribeCard = getAdaptiveCardFromTemplate(subscribeCardTemplate, {
          subscribeUrl: `${process.env.RINGCENTRAL_CHATBOT_SERVER}/bot-notify/${notifyId}`,
        });
        await bot.sendAdaptiveCard(groupId, subscribeCard);
      }
    }
  } catch (e) {
    console.error(e);
  }
  res.status(200);
  res.send('ok');
}

exports.notificationInteractiveMessages = notificationInteractiveMessages;
exports.botInteractiveMessagesHandler = botInteractiveMessagesHandler;
