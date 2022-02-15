const axios = require('axios');
const { ICON_URL } = require('./constants');

function sendMessageToRCWebhook(rcWebhook, message) {
  return axios.post(rcWebhook, message, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  });
}

async function sendTextMessageToRCWebhook(webhookUri, message) {
  await sendMessageToRCWebhook(webhookUri, {
    icon: ICON_URL,
    title: message,
    activity: 'Bugsnag Add-in',
  });
}

async function sendAdaptiveCardToRCWebhook(
  webhookUri,
  card,
  fallbackMessage = 'New event',
) {
  const message = {
    icon: ICON_URL,
    activity: 'Bugsnag Add-in',
  };
  if (card) {
    message.attachments = [card];
  } else {
    message.title = fallbackMessage;
  }
  await sendMessageToRCWebhook(webhookUri, message);
}

exports.sendTextMessageToRCWebhook = sendTextMessageToRCWebhook;
exports.sendAdaptiveCardToRCWebhook = sendAdaptiveCardToRCWebhook;
