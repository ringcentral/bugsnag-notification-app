const crypto = require('crypto');
const Bot = require('ringcentral-chatbot-core/dist/models/bot').default;

const { requestWithoutWaitingResponse } = require('../utils/requestWithoutWaitingResponse');
const { Webhook } = require('../models/webhook');
const { notificationInteractiveMessages, botInteractiveMessagesHandler } = require('../handlers/interactiveMessages');

const { formatAdaptiveCardMessage } = require('../utils/formatAdaptiveCardMessage');

// notification from Bugsnag for notification add-in
async function notification(req, res) {
  const id = req.params.id;
  const webhookRecord = await Webhook.findByPk(id);
  if (!webhookRecord) {
    res.status(404);
    res.send('Not found');
    return;
  }
  // console.log(JSON.stringify(req.body, null, 2));
  const message = formatAdaptiveCardMessage(req.body, id);
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

// notification from Bugsnag for bot add-in
async function botNotification(req, res) {
  const jwtToken = req.params.id;
  const decodedToken = decodeToken(jwtToken);
  if (!decodedToken) {
    res.status(401);
    res.send('Token invalid.');
    return;
  }
  const { botId, groupId } = decodedToken;
  // console.log(JSON.stringify(req.body, null, 2));
  const message = formatAdaptiveCardMessage(req.body, id);
  // console.log(JSON.stringify(message.attachments[0], null, 2));
  // request without waiting response to reduce lambda function time
  try {
    const bot = await Bot.findByPk(botId);
    if (bot) {
      await bot.sendAdaptiveCard(groupId, message);
    }
    res.status(200);
    res.send('ok');
  } catch (e) {
    console.log(e);
    res.status(500);
    res.send('error');
  }
};

// interactive messages from RingCentral
function interactiveMessages(req, res) {
  const body = req.body;
  let SHARED_SECRET = process.env.INTERACTIVE_MESSAGES_SHARED_SECRET;
  const isForBot = body && body.data && body.data.messageType && body.data.messageType === 'Bot';
  if (isForBot) {
    SHARED_SECRET = process.env.RINGCENTRAL_CHATBOT_INTERACTIVE_MESSAGES_SHARED_SECRET;
  }
  if (SHARED_SECRET) {
    const signature = req.get('X-Glip-Signature', 'sha1=');
    const encryptedBody =
      crypto.createHmac('sha1', SHARED_SECRET).update(JSON.stringify(req.body)).digest('hex');
    if (encryptedBody !== signature) {
      res.status(401).send();
      return;
    }
  }
  // console.log(JSON.stringify(body, null, 2));
  if (!body.data || !body.user || !body.conversation) {
    res.status(400);
    res.send('Params error');
    return;
  }
  if (isForBot) {
    return botInteractiveMessagesHandler(req, res);
  }
  return notificationInteractiveMessages(req, res);
}

exports.notification = notification;
exports.botNotification = botNotification;
exports.interactiveMessages = interactiveMessages;
