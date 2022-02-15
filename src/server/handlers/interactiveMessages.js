const Bot = require('ringcentral-chatbot-core/dist/models/Bot').default;

const { Bugsnag, ACTION_DESCRIPTIONS, SNOOZE_TYPE_DESCRIPTIONS } = require('../utils/bugsnag');
const { Webhook } = require('../models/webhook');
const { AuthToken } = require('../models/authToken');

const { sendAdaptiveCardToRCWebhook, sendTextMessageToRCWebhook } = require('../utils/messageHelper');
const { findItemInAdaptiveCard } = require('../utils/adaptiveCardHelper');

const botActions = require('../bot/actions');
const { getAdaptiveCardFromTemplate } = require('../utils/getAdaptiveCardFromTemplate');
const authTokenTemplate = require('../adaptiveCards/authToken.json');
const messageCardTemplate = require('../adaptiveCards/message.json');
const stateOperationLogTemplate = require('../adaptiveCards/stateOperationLog.json');

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
      `Hi ${body.user.firstName} ${body.user.lastName}, your personal token is saved. Please click previous action button again.`,
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
  try {
    const bugsnag = new Bugsnag({
      authToken: authToken.data,
      projectId: body.data.projectId,
      errorId: body.data.errorId,
    });
    await bugsnag.operate({ action, data: body.data });
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

function getCardWithOperationLog(card, data, user) {
  const action = data.action;
  const newCard = {
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    type: 'AdaptiveCard',
    version: '1.3',
    body: card.body,
    actions: card.actions,
    fallbackText: card.fallbackText,
  };
  const operationLogItem = findItemInAdaptiveCard(newCard, 'operationLog');
  if (!operationLogItem) {
    return null;
  }
  const name = `${user.firstName} ${user.lastName}`;
  if (action === 'fix') {
    operationLogItem.style = 'good';
  } 
  const currentTime = new Date();
  const operationTime = `${currentTime.toISOString().split('.')[0]}Z`;
  let operationLogDescriptions;
  if (action === 'comment') {
    operationLogDescriptions = [{
      type: 'TextBlock',
      wrap: true,
      text: `**${name}** - {{DATE(${operationTime})}} {{TIME(${operationTime})}}`,
    }, {
      type: 'TextBlock',
      wrap: true,
      text: `${data.comment}`,
      spacing: 'None',
      isSubtle: true,
    }];
  } else {
    operationLogDescriptions = [getAdaptiveCardFromTemplate(stateOperationLogTemplate, {
      action: ACTION_DESCRIPTIONS[action],
      operationTime,
      name,
    })];
    if (action === 'snooze') {
      operationLogDescriptions.push({
        type: 'TextBlock',
        wrap: true,
        text: SNOOZE_TYPE_DESCRIPTIONS[data.snoozeType],
        spacing: 'None',
        isSubtle: true,
      });
    }
    const stateActionsItem = findItemInAdaptiveCard(newCard, 'actions');
    const reopenActions = findItemInAdaptiveCard(newCard, 'openActions');
    if (action === 'open') {
      delete stateActionsItem.isVisible;
      reopenActions.isVisible = false;
    } else {
      delete reopenActions.isVisible;
      stateActionsItem.isVisible = false;
    }
  }
  operationLogItem.items = operationLogDescriptions;
  delete operationLogItem.isVisible;
  return newCard;
}

async function addOperationLogIntoCard(bot, cardId, data, user) {
  try {
    const cardResponse = await bot.rc.get(`/restapi/v1.0/glip/adaptive-cards/${cardId}`);
    const card = cardResponse.data;
    const newCard = getCardWithOperationLog(card, data, user);
    if (newCard) {
      await bot.updateAdaptiveCard(cardId, newCard);
    }
  } catch (e) {
    console.error(e);
  }
}

async function botInteractiveMessagesHandler(req, res) {
  const body = req.body;
  const groupId = body.conversation.id;
  const botId = body.data.botId;
  const cardId = req.body.card.id;
  try {
    const bot = await Bot.findByPk(botId);
    if (!bot) {
      res.status(404);
      res.send('Params error');
      return;
    }
    const action = body.data.action;
    if (action === 'subscribe') {
      await botActions.sendSubscribeCard(bot, groupId);
      res.status(200);
      res.send('ok');
      return;
    }
    const authToken = await AuthToken.findByPk(`${body.user.accountId}-${body.user.id}`);
    if (action === 'saveAuthToken') {
      await saveAuthToken(authToken, body);
      const newCard = getAdaptiveCardFromTemplate(
        messageCardTemplate,
        {
          message: `Hi **${body.user.firstName} ${body.user.lastName}**, your Bugsnag personal token is saved successfully. If you want to execute previously interactive actions, please click the action button again.`,
        },
      );
      await bot.updateAdaptiveCard(cardId, newCard);
      res.status(200);
      res.send('ok');
      return;
    }
    if (action === 'removeAuthToken') {
      if (authToken) {
        authToken.data = '';
        await authToken.save();
      }
      const newCard = getAdaptiveCardFromTemplate(
        messageCardTemplate,
        {
          message: `Hi **${body.user.firstName} ${body.user.lastName}**, your Bugsnag personal token is removed successfully.`,
        },
      );
      await bot.updateAdaptiveCard(cardId, newCard);
      res.status(200);
      res.send('ok');
      return;
    }
    if (!authToken || !authToken.data || authToken.data.length == 0) {
      await botActions.sendAuthCard(bot, groupId);
      res.status(200);
      res.send('ok');
      return;
    }
    try {
      const bugsnag = new Bugsnag({
        authToken: authToken.data,
        projectId: body.data.projectId,
        errorId: body.data.errorId,
      });
      await bugsnag.operate({ action, data: body.data });
      res.status(200);
      res.end();
      await addOperationLogIntoCard(bot, cardId, body.data, body.user);
    } catch (e) {
      if (e.response) {
        if (e.response.status === 401) {
          authToken.data = '';
          await authToken.save();
          await bot.sendAdaptiveCard(groupId, getAdaptiveCardFromTemplate(authTokenTemplate, {
            botId,
            messageType: 'Bot',
            webhookId: null,
          }));
        } else if (e.response.status === 403) {
          await bot.sendMessage(groupId, {
            text: `Hi ${body.user.firstName}, your Bugsnag role doesn't have permission to perform this action.`,
          });
        }
      } else {
        console.error(e);
      }
      res.status(200);
      res.send('ok');
    }
  } catch (e) {
    console.error(e);
    res.status(500);
    res.send('Internal error');
  }
}

exports.notificationInteractiveMessages = notificationInteractiveMessages;
exports.botInteractiveMessagesHandler = botInteractiveMessagesHandler;
