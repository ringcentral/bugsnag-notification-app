const { Analytics } = require('../utils/analytics');
const botActions = require('./actions');

async function botHandler({
  type, // could be 'BotAdded', 'BotRemoved', 'Message4Bot', 'BotGroupLeft', 'BotJoinGroup', 'Maintain', 'SetupDatabase'
  bot, // the bot instance, check src/models/Bot.ts for instance methods
  text, // the text message user posted in chatgroup
  group, // the group object, can get chat group id from group.id
  userId, // message creator's id
  message // message object, check ringcentral api document for detail
}) {
  const analytics = new Analytics({
    mixpanelKey: process.env.MIXPANEL_KEY,
    secretKey: process.env.ANALYTICS_SECRET_KEY,
    userId: bot ? bot.id : message.ownerId,
    accountId: bot && bot.token && bot.token.creator_account_id,
  });
  if (type === 'BotJoinGroup') {
    await botActions.sendHelpCard(bot, group.id);
    return;
  }
  if (type === 'GroupJoined') {
    await analytics.trackUserAction('botAddedToTeam', null, {
      chatId: message.body.id,
      chatMemberCount: message.body.members.length - 1, // exclude bot itself
    });
  }
  if (type === 'GroupLeft') {
    await analytics.trackUserAction('botRemovedFromTeam', null, {
      chatId: message.body.id,
      chatMemberCount: message.body.members.length,
    });
    return;
  }
  if (type === 'Message4Bot') {
    if (text === 'subscribe') {
      await botActions.sendSubscribeCard(bot, group.id);
    } else if (text === 'authorize') {
      await botActions.sendAuthCard(bot, group.id);
    } else if (text === 'unauthorize') {
      await botActions.sendUnauthorizedCard(bot, group.id);
    } else {
      await botActions.sendHelpCard(bot, group.id);
      await analytics.trackBotAction('receivedMessage', {
        action: 'helpOrOther',
        result: 'success',
        chatId: group.id,
        chatMemberCount: group.members.length - 1,
      });
      return;
    }
    // Track text is 'subscribe', 'authorize', 'unauthorize'
    await analytics.trackBotAction('receivedMessage', {
      action: text,
      result: 'success',
      chatId: group.id,
      chatMemberCount: group.members.length - 1,
    });
  }
}

exports.botHandler = botHandler;
