const { getAdaptiveCardFromTemplate } = require('./getAdaptiveCardFromTemplate');
const {
  formatReleaseMessage,
  formatErrorMessage,
  formatCommentMessage,
  formatErrorStateMessage,
} = require('./formatBugsnagMessage');
const { findItemInAdaptiveCard } = require('./findItemInAdaptiveCard');

const releaseTemplate = require('../adaptiveCards/release.json');
const commentTemplate = require('../adaptiveCards/comment.json');
const errorTemplate = require('../adaptiveCards/error.json');
const errorStateTemplate = require('../adaptiveCards/errorState.json');
const authTokenTemplate = require('../adaptiveCards/authToken.json');

const ICON_URL = 'https://raw.githubusercontent.com/ringcentral/bugsnag-notification-app/main/icon/bugsnag-white.png';
const THUMB_ICON_BASE_URL = 'https://raw.githubusercontent.com/ringcentral/bugsnag-notification-app/main/icon/';
const THUMB_ICON_URL = {
  collaborator_fixed: `${THUMB_ICON_BASE_URL}/collaborator-fixed.png`,
  collaborator_reopened: `${THUMB_ICON_BASE_URL}/collaborator-reopened.png`,
  collaborator_snoozed: `${THUMB_ICON_BASE_URL}/collaborator-snooze.png`,
  collaborator: `${THUMB_ICON_BASE_URL}/collaborator.png`,
  comment: `${THUMB_ICON_BASE_URL}/comment.png`,
  error: `${THUMB_ICON_BASE_URL}/error.png`,
  general: `${THUMB_ICON_BASE_URL}/general.png`,
  new: `${THUMB_ICON_BASE_URL}/new.png`,
  release: `${THUMB_ICON_BASE_URL}/release.png`,
  reopened: `${THUMB_ICON_BASE_URL}/reopened.png`,
  repeated: `${THUMB_ICON_BASE_URL}/repeated.png`,
  status_ignored: `${THUMB_ICON_BASE_URL}/ignored.png`,
  status_snoozed: `${THUMB_ICON_BASE_URL}/snoozed.png`,
  status_fixed: `${THUMB_ICON_BASE_URL}/fixed.png`,
  status_open: `${THUMB_ICON_BASE_URL}/open.png`,
  severity_error: `${THUMB_ICON_BASE_URL}/error.dot.png`,
  severity_warning: `${THUMB_ICON_BASE_URL}/warning.dot.png`,
  severity_info: `${THUMB_ICON_BASE_URL}/info.dot.png`,
};

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

function formatErrorMessageIntoCard(errorMessage, webhookId) {
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
    webhookId: webhookId,
  });
  if (moreStackTrace.length > 0) {
    const viewMore = findItemInAdaptiveCard(card, 'shoreMoreButtons');
    delete viewMore.isVisible; //  set view more button visible
  }
  return card;
}

function formatErrorStateMessageIntoCard(errorMessage, webhookId) {
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
    webhookId: webhookId,
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

function formatCommentMessageIntoCard(commentMessage, webhookId) {
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
  });
}

function formatAdaptiveCardMessage(bugsnagMessage, webhookId) {
  const attachments = []
  let formattedMessage;
  if (bugsnagMessage.release) {
    formattedMessage = formatReleaseMessage(bugsnagMessage);
    const releaseCard = formatReleaseMessageIntoCard(formattedMessage);
    attachments.push(releaseCard);
  }
  if (bugsnagMessage.comment) {
    formattedMessage = formatCommentMessage(bugsnagMessage);
    const commentCard = formatCommentMessageIntoCard(formattedMessage, webhookId);
    attachments.push(commentCard);
  } else if (bugsnagMessage.error) {
    let errorCard
    if (bugsnagMessage.trigger.type === 'errorStateManualChange') {
      formattedMessage = formatErrorStateMessage(bugsnagMessage);
      errorCard = formatErrorStateMessageIntoCard(formattedMessage, webhookId);
    } else {
      formattedMessage = formatErrorMessage(bugsnagMessage);
      errorCard = formatErrorMessageIntoCard(formattedMessage, webhookId);
    }
    attachments.push(errorCard);
  }
  if (attachments.length === 0) {
    return {
      title: `**${bugsnagMessage.trigger.message}** for [${bugsnagMessage.project.name}](${bugsnagMessage.project.url})`,
    };
  }
  return {
    // title: formattedMessage && formattedMessage.subject,
    attachments,
    icon: ICON_URL,
    activity: 'Bugsnag Add-in',
  };
}

function createAuthTokenRequestCard({ webhookId }) {
  const card = getAdaptiveCardFromTemplate(authTokenTemplate, {
    webhookId,
  });
  return {
    attachments: [card],
    icon: ICON_URL,
    activity: 'Bugsnag Add-in',
  };
}

function createMessageCard({ message }) {
  return {
    icon: ICON_URL,
    title: message,
    activity: 'Bugsnag Add-in',
  }
}

exports.formatAdaptiveCardMessage = formatAdaptiveCardMessage;
exports.createAuthTokenRequestCard = createAuthTokenRequestCard;
exports.createMessageCard = createMessageCard;
