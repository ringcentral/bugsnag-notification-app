const { getAdaptiveCardFromTemplate } = require('./getAdaptiveCardFromTemplate');
const {
  formatReleaseMessage,
  formatErrorMessage,
  formatCommentMessage,
  formatErrorStateMessage,
} = require('./formatBugsnagMessage');
const { findItemInAdaptiveCard } = require('./adaptiveCardHelper');
const { THUMB_ICON_URL } = require('./constants');

const releaseTemplate = require('../adaptiveCards/release.json');
const commentTemplate = require('../adaptiveCards/comment.json');
const errorTemplate = require('../adaptiveCards/error.json');
const errorStateTemplate = require('../adaptiveCards/errorState.json');

function formatReleaseMessageIntoCard(releaseMessage) {
  return getAdaptiveCardFromTemplate(releaseTemplate, {
    summary: releaseMessage.summary,
    subject: releaseMessage.subject,
    version: releaseMessage.version,
    by: releaseMessage.by || 'none',
    stage: releaseMessage.stage,
    commit: releaseMessage.commit || 'none',
    url: releaseMessage.url,
  });
}

function splitStackTrace(originalStackTrace) {
  let stackTrace = '';
  let moreStackTrace = '';
  if (originalStackTrace.length > 5) {
    stackTrace = originalStackTrace.slice(0, 5).join('\n');
    moreStackTrace = originalStackTrace.slice(5).join('\n');
  } else {
    stackTrace = originalStackTrace.join('\n');
  }
  return { stackTrace, moreStackTrace };
}

function capitalizeFirstLetter(string) {
  if (string.length === 0) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatErrorMessageIntoCard(errorMessage, webhookId, messageType, botId) {
  let thumbUrl = THUMB_ICON_URL.error;
  if (errorMessage.triggerType === 'errorEventFrequency' || errorMessage.triggerType === 'powerTen') {
    thumbUrl = THUMB_ICON_URL.repeated;
  }
  if (errorMessage.triggerType === 'reopened') {
    thumbUrl = THUMB_ICON_URL.reopened;
  }
  if (errorMessage.triggerType === 'firstException') {
    thumbUrl = THUMB_ICON_URL.new;
  }
  const { stackTrace, moreStackTrace } = splitStackTrace(errorMessage.stackTrace);
  const statusIconUrl = THUMB_ICON_URL[`status_${errorMessage.status}`] || THUMB_ICON_URL['status_open'];
  const severityIconUrl = THUMB_ICON_URL[`severity_${errorMessage.severity}`] || THUMB_ICON_URL['severity_info'];
  const card = getAdaptiveCardFromTemplate(errorTemplate, {
    subject: errorMessage.subject,
    summary: errorMessage.summary,
    errorIcon: thumbUrl,
    message: errorMessage.message,
    stackTrace,
    moreStackTrace,
    severity: capitalizeFirstLetter(errorMessage.severity),
    status: capitalizeFirstLetter(errorMessage.status),
    statusIcon: statusIconUrl,
    severityIcon: severityIconUrl,
    url: errorMessage.url,
    errorId: errorMessage.errorId,
    projectId: errorMessage.projectId,
    webhookId,
    messageType,
    botId,
  });
  if (moreStackTrace.length > 0) {
    const viewMore = findItemInAdaptiveCard(card, 'shoreMoreButtons');
    delete viewMore.isVisible; //  set view more button visible
  }
  return card;
}

function formatErrorStateMessageIntoCard(errorMessage, webhookId, messageType, botId) {
  const { stackTrace, moreStackTrace } = splitStackTrace(errorMessage.stackTrace);
  const iconUrl = THUMB_ICON_URL[`collaborator_${errorMessage.stateChange}`] || THUMB_ICON_URL['collaborator'];
  const statusIconUrl = THUMB_ICON_URL[`status_${errorMessage.status}`] || THUMB_ICON_URL['status_open'];
  const severityIconUrl = THUMB_ICON_URL[`severity_${errorMessage.severity}`] || THUMB_ICON_URL['severity_info'];
  const card = getAdaptiveCardFromTemplate(errorStateTemplate, {
    subject: errorMessage.subject,
    summary: errorMessage.summary,
    stateIcon: iconUrl,
    stackTrace,
    moreStackTrace,
    releaseStage: capitalizeFirstLetter(errorMessage.releaseStage),
    project: errorMessage.project,
    severity: capitalizeFirstLetter(errorMessage.severity),
    status: capitalizeFirstLetter(errorMessage.status),
    statusIcon: statusIconUrl,
    severityIcon: severityIconUrl,
    errorId: errorMessage.errorId,
    projectId: errorMessage.projectId,
    webhookId,
    messageType,
    botId,
  });
  if (moreStackTrace.length > 0) {
    const viewMore = findItemInAdaptiveCard(card, 'shoreMoreButtons');
    delete viewMore.isVisible; //  set view more button visible
  }
  if (errorMessage.status === 'open') {
    const actions = findItemInAdaptiveCard(card, 'actions');
    delete actions.isVisible;
  } else {
    const actions = findItemInAdaptiveCard(card, 'openActions');
    delete actions.isVisible;
  }
  return card;
}

function formatCommentMessageIntoCard(commentMessage, webhookId, messageType, botId) {
  const { stackTrace, moreStackTrace } = splitStackTrace(commentMessage.stackTrace);
  const statusIconUrl = THUMB_ICON_URL[`status_${commentMessage.status}`] || THUMB_ICON_URL['status_open'];
  const severityIconUrl = THUMB_ICON_URL[`severity_${commentMessage.severity}`] || THUMB_ICON_URL['severity_info'];
  return getAdaptiveCardFromTemplate(commentTemplate, {
    subject: commentMessage.subject,
    summary: commentMessage.summary,
    comment: commentMessage.comment,
    stackTrace,
    moreStackTrace,
    releaseStage: capitalizeFirstLetter(commentMessage.releaseStage),
    project: commentMessage.project,
    severity: capitalizeFirstLetter(commentMessage.severity),
    status: capitalizeFirstLetter(commentMessage.status),
    statusIcon: statusIconUrl,
    severityIcon: severityIconUrl,
    errorId: commentMessage.errorId,
    projectId: commentMessage.projectId,
    webhookId,
    messageType,
    botId,
  });
}

function formatBugsnagMessageIntoCard({
  bugsnagMessage,
  webhookId = null,
  messageType = 'Notification',
  botId = null,
}) {
  let formattedMessage;
  if (bugsnagMessage.release) {
    formattedMessage = formatReleaseMessage(bugsnagMessage);
    return formatReleaseMessageIntoCard(formattedMessage);
  }
  if (bugsnagMessage.comment) {
    formattedMessage = formatCommentMessage(bugsnagMessage);
    return formatCommentMessageIntoCard(formattedMessage, webhookId, messageType, botId);
  }
  if (bugsnagMessage.error) {
    if (bugsnagMessage.trigger.type === 'errorStateManualChange') {
      formattedMessage = formatErrorStateMessage(bugsnagMessage);
      return formatErrorStateMessageIntoCard(formattedMessage, webhookId, messageType, botId);
    } else {
      formattedMessage = formatErrorMessage(bugsnagMessage);
      return formatErrorMessageIntoCard(formattedMessage, webhookId, messageType, botId);
    }
  }
  return null;
}

exports.formatBugsnagMessageIntoCard = formatBugsnagMessageIntoCard;
