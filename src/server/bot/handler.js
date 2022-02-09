const { getAdaptiveCardFromTemplate } = require('../utils/getAdaptiveCardFromTemplate');
const botJoinCardTemplate = require('../adaptiveCards/botJoinCard.json');

async function botJoinHandler({ bot, group }) {
  const joinWelcomeCard = getAdaptiveCardFromTemplate(botJoinCardTemplate, {
    botId: bot.id,
  });
  await bot.sendAdaptiveCard(group.id, joinWelcomeCard);
}

async function botHandler({
  type, // could be 'BotAdded', 'BotRemoved', 'Message4Bot', 'BotGroupLeft', 'BotJoinGroup', 'Maintain', 'SetupDatabase'
  bot, // the bot instance, check src/models/Bot.ts for instance methods
  text, // the text message user posted in chatgroup
  group, // the group object, can get chat group id from group.id
  userId, // message creator's id
  message // message object, check ringcentral api document for detail
}) {
  console.log(type);
  if (type === 'BotJoinGroup') {
    await botJoinHandler({ bot, group });
    return;
  }
  if (type === 'Message4Bot') {
    console.log(text);
    await botJoinHandler({ bot, group });
    return;
  }
}

exports.botHandler = botHandler;
