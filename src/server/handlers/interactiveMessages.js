const Bot = require('ringcentral-chatbot-core/dist/models/bot').default;

const { Bugsnag } = require('../utils/bugsnag');
const { Webhook } = require('../models/webhook');
const { AuthToken } = require('../models/authToken');

const { generateToken } = require('../utils/jwt');
const { sendAdaptiveCardToRCWebhook, sendTextMessageToRCWebhook } = require('../utils/messageHelper');
const { getAdaptiveCardFromTemplate } = require('../utils/getAdaptiveCardFromTemplate');
const subscribeCardTemplate = require('../adaptiveCards/subscribeCard.json');
const authTokenTemplate = require('../adaptiveCards/authToken.json');
const authTokenSavedTemplate = require('../adaptiveCards/authTokenSaved.json');

async function saveAuthToken(authToken, body) {
  if (authToken) {
    authToken.data = body.data.token;
    await authToken.save();
    return;
  }
  await AuthToken.create({
    id: `${body.user.accountId}-${body.user.id}`,
    data: body.data.token,
  });
}

async function sendAuthCardToRCWebhook(webhookUri, webhookId) {
  await sendAdaptiveCardToRCWebhook(
    webhookUri,
    getAdaptiveCardFromTemplate(authTokenTemplate, {
      webhookId,
      messageType: 'Notification',
      botId: null,
    }),
  )
}

async function notificationInteractiveMessages(req, res) {
  const body = req.body;
  const webhookId = body.data.webhookId;
  const webhookRecord = await Webhook.findByPk(webhookId);
  if (!webhookRecord) {
    res.status(404);
    res.send('Not found');
    return;
  }
  const authToken = await AuthToken.findByPk(`${body.user.accountId}-${body.user.id}`);
  const action = body.data.action;
  if (action === 'saveAuthToken') {
    await saveAuthToken(authToken, body);
    await sendTextMessageToRCWebhook(
      webhookRecord.rc_webhook,
      `Hi ${body.user.firstName} ${body.user.lastName}, your personal token is saved. Please click action button again.`,
    );
    res.status(200);
    res.send('ok');
    return;
  }
  if (!authToken || !authToken.data || authToken.data.length == 0) {
    await sendAuthCardToRCWebhook(webhookRecord.rc_webhook, webhookId);
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
        await sendAuthCardToRCWebhook(webhookRecord.rc_webhook, webhookId);
      } else if (e.response.status === 403) {
        await sendTextMessageToRCWebhook(
          webhookRecord.rc_webhook,
          `Hi ${body.user.firstName}, your Bugsnag role doesn't have permission to perform this action.`,
        );
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
  const botId = body.data.botId;
  const cardId = req.body.card.id;
  try {
    const bot = await Bot.findByPk(botId);
    if (!bot) {
      res.status(400);
      res.send('Params error');
      return;
    }
    const action = body.data.action;
    if ( action === 'subscribe') {
      const notifyId = generateToken({ botId, groupId });
      const subscribeCard = getAdaptiveCardFromTemplate(subscribeCardTemplate, {
        subscribeUrl: `${process.env.RINGCENTRAL_CHATBOT_SERVER}/bot-notify/${notifyId}`,
      });
      await bot.sendAdaptiveCard(groupId, subscribeCard);
    }
    const authToken = await AuthToken.findByPk(`${body.user.accountId}-${body.user.id}`);
    if (action === 'saveAuthToken') {
      await saveAuthToken(authToken, body);
      const authSavedCard = getAdaptiveCardFromTemplate(
        authTokenSavedTemplate,
        { name: `${body.user.firstName} ${body.user.lastName}` },
      );
      await bot.updateAdaptiveCard(cardId, authSavedCard);
      res.status(200);
      res.send('ok');
      return;
    }
    if (!authToken || !authToken.data || authToken.data.length == 0) {
      await bot.sendAdaptiveCard(groupId, getAdaptiveCardFromTemplate(authTokenTemplate, {
        botId,
        messageType: 'Bot',
        webhookId: null,
      }));
      res.status(200);
      res.send('ok');
      return;
    }
    console.log(action);
    res.status(200);
    res.send('ok');
  } catch (e) {
    console.error(e);
    res.status(500);
    res.send('ok');
  }
}

exports.notificationInteractiveMessages = notificationInteractiveMessages;
exports.botInteractiveMessagesHandler = botInteractiveMessagesHandler;
