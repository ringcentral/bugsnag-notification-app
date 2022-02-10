const { generateToken } = require('../utils/jwt');
const { getAdaptiveCardFromTemplate } = require('../utils/getAdaptiveCardFromTemplate');
const subscribeCardTemplate = require('../adaptiveCards/subscribeCard.json');
const botJoinCardTemplate = require('../adaptiveCards/botJoinCard.json');
const authTokenTemplate = require('../adaptiveCards/authToken.json');
const removeAuthTokenTemplate = require('../adaptiveCards/removeAuthToken.json');

async function sendHelpCard(bot, groupId) {
  const joinWelcomeCard = getAdaptiveCardFromTemplate(botJoinCardTemplate, {
    botId: bot.id,
  });
  await bot.sendAdaptiveCard(groupId, joinWelcomeCard);
}

async function sendSubscribeCard(
  bot,
  groupId
) {
  const notifyId = generateToken({ botId: bot.id, groupId });
  const subscribeCard = getAdaptiveCardFromTemplate(subscribeCardTemplate, {
    subscribeUrl: `${process.env.RINGCENTRAL_CHATBOT_SERVER}/bot-notify/${notifyId}`,
  });
  await bot.sendAdaptiveCard(groupId, subscribeCard);
}

async function sendAuthCard(
  bot,
  groupId,
) {
  await bot.sendAdaptiveCard(groupId, getAdaptiveCardFromTemplate(authTokenTemplate, {
    botId: bot.id,
    messageType: 'Bot',
    webhookId: null,
  }));
}

async function sendUnauthorizedCard(bot, groupId) {
  await bot.sendAdaptiveCard(groupId, getAdaptiveCardFromTemplate(removeAuthTokenTemplate, {
    botId: bot.id,
    messageType: 'Bot',
    webhookId: null,
  }));
}

exports.sendSubscribeCard = sendSubscribeCard;
exports.sendHelpCard = sendHelpCard;
exports.sendAuthCard = sendAuthCard;
exports.sendUnauthorizedCard = sendUnauthorizedCard;
