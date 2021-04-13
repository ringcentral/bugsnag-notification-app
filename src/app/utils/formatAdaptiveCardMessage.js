const {
  formatReleaseMessage,
  formatErrorMessage,
  formatCommentMessage,
} = require('./formatBugsnagMessage');

const releaseTemplate = require('../adaptiveCards/release.json');
const releaseString = JSON.stringify(releaseTemplate, null, 2);
const commentTemplate = require('../adaptiveCards/comment.json');
const commentString = JSON.stringify(commentTemplate, null, 2);
const errorTemplate = require('../adaptiveCards/error.json');
const errorString = JSON.stringify(errorTemplate, null, 2);

function formatReleaseMessageIntoCard(message) {
  const releaseMessage = formatReleaseMessage(message);
  let string = releaseString.replace("{{subject}}", releaseMessage.subject);
  string = string.replace("{{version}}", releaseMessage.version);
  string = string.replace("{{by}}", releaseMessage.by || 'none');
  string = string.replace("{{stage}}", releaseMessage.stage);
  string = string.replace("{{commit}}", releaseMessage.commit || 'none');
  return JSON.parse(string);
}

function formatCommentMessageIntoCard(message) {
  const commentMessage = formatCommentMessage(message);
  let string = commentString.replace("{{subject}}", commentMessage.subject);
  string = string.replace("{{name}}", commentMessage.userName);
  string = string.replace("{{comment}}", commentMessage.comment);
  return JSON.parse(string);
}

function formatErrorMessageIntoCard(message) {
  const errorMessage = formatErrorMessage(message);
  let string = errorString.replace("{{subject}}", errorMessage.subject);
  string = string.replace("{{message}}", errorMessage.message);
  let stackTrace = errorMessage.stackTrace;
  let moreStackTrace = '';
  if (stackTrace) {
    const stackTraceLines = stackTrace.split("\n");
    if (stackTraceLines.length > 5) {
      stackTrace = stackTraceLines.slice(0, 5).join("\\n")
      moreStackTrace = stackTraceLines.slice(5).join("\\n")
    } else {
      stackTrace = stackTraceLines.join("\\n")
    }
  }
  string = string.replace("{{stackTrace}}", stackTrace);
  string = string.replace("{{moreStackTrace}}", moreStackTrace);
  string = string.replace("{{severity}}", errorMessage.severity);
  string = string.replace("{{status}}", errorMessage.status);
  string = string.replace("{{url}}", errorMessage.url);
  const card = JSON.parse(string);
  if (moreStackTrace.length > 0) {
    delete card.body[0].items[2].columns[1].isVisible; //  set view more button visible
  }
  return card;
}

function formatTeamsMessage(bugsnapMessage) {
  const attachments = []
  if (bugsnapMessage.release) {
    const releaseCard = formatReleaseMessageIntoCard(bugsnapMessage);
    attachments.push({
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: releaseCard,
   });
  }
  if (bugsnapMessage.comment) {
    const commentCard = formatCommentMessageIntoCard(bugsnapMessage);
    attachments.push({
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: commentCard,
   });
  } else if (bugsnapMessage.error) {
    const errorCard = formatErrorMessageIntoCard(bugsnapMessage);
    attachments.push({
      contentType: "application/vnd.microsoft.card.adaptive",
      contentUrl: null,
      content: errorCard,
   });
  }
  if (attachments.length === 0) {
    return {
      text: `**${bugsnapMessage.trigger.message}** for [${bugsnapMessage.project.name}](${bugsnapMessage.project.url})`,
    }
  }
  return {
    type: 'message',
    attachments,
  };
}

function formatAdaptiveCardMessage(bugsnapMessage) {
  const attachments = []
  if (bugsnapMessage.release) {
    const releaseCard = formatReleaseMessageIntoCard(bugsnapMessage);
    attachments.push(releaseCard);
  }
  if (bugsnapMessage.comment) {
    const commentCard = formatCommentMessageIntoCard(bugsnapMessage);
    attachments.push(commentCard);
  } else if (bugsnapMessage.error) {
    const errorCard = formatErrorMessageIntoCard(bugsnapMessage);
    attachments.push(errorCard);
  }
  if (attachments.length === 0) {
    return {
      title: `**${bugsnapMessage.trigger.message}** for [${bugsnapMessage.project.name}](${bugsnapMessage.project.url})`,
    }
  }
  return {
    title,
    attachments,
  };
}

exports.formatAdaptiveCardMessage = formatAdaptiveCardMessage;
exports.formatTeamsMessage = formatTeamsMessage;
