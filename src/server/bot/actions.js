const { generateToken } = require('../utils/jwt');
const { getAdaptiveCardFromTemplate } = require('../utils/getAdaptiveCardFromTemplate');
const subscribeCardTemplate = require('../adaptiveCards/subscribeCard.json');
const botJoinCardTemplate = require('../adaptiveCards/botJoinCard.json');

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

exports.sendSubscribeCard = sendSubscribeCard;
exports.sendHelpCard = sendHelpCard;
