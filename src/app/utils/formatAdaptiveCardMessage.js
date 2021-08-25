const {
  formatReleaseMessageV2,
  formatErrorMessageV2,
  formatCommentMessageV2,
  formatErrorStateMessageV2,
} = require('./formatBugsnagMessage');

const releaseTemplate = require('../adaptiveCards/release.json');
const releaseString = JSON.stringify(releaseTemplate, null, 2);
const commentTemplate = require('../adaptiveCards/comment.json');
const commentString = JSON.stringify(commentTemplate, null, 2);
const errorTemplate = require('../adaptiveCards/error.json');
const errorString = JSON.stringify(errorTemplate, null, 2);
const errorStateTemplate = require('../adaptiveCards/errorState.json');
const errorStateString = JSON.stringify(errorStateTemplate, null, 2);
const authTokenTemplate = require('../adaptiveCards/authToken.json');
const authTokenString = JSON.stringify(authTokenTemplate, null, 2);

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
  let string = releaseString.replace("{{subject}}", releaseMessage.subject);
  string = string.replace("{{version}}", releaseMessage.version);
  string = string.replace("{{by}}", releaseMessage.by || 'none');
  string = string.replace("{{stage}}", releaseMessage.stage);
  string = string.replace("{{commit}}", releaseMessage.commit || 'none');
  string = string.replace("{{url}}", releaseMessage.url);
  return JSON.parse(string);
}

function splitStackTrace(originalStackTrace) {
  let stackTrace = originalStackTrace;
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
  return { stackTrace, moreStackTrace };
}

function capitalizeFirstLetter(string) {
  if (string.length === 0) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatErrorMessageIntoCard(errorMessage, webhookId) {
  let string = errorString.replace("{{subject}}", errorMessage.subject);
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
  string = string.replace("{{errorIcon}}", thumbUrl);
  string = string.replace("{{message}}", errorMessage.message);
  const { stackTrace, moreStackTrace } = splitStackTrace(errorMessage.stackTrace);
  string = string.replace("{{stackTrace}}", stackTrace);
  string = string.replace("{{moreStackTrace}}", moreStackTrace);
  string = string.replace("{{severity}}", capitalizeFirstLetter(errorMessage.severity));
  string = string.replace("{{status}}", capitalizeFirstLetter(errorMessage.status));
  const statusIconUrl = THUMB_ICON_URL[`status_${errorMessage.status}`] || THUMB_ICON_URL['status_open'];
  string = string.replace("{{statusIcon}}", statusIconUrl);
  const severityIconUrl = THUMB_ICON_URL[`severity_${errorMessage.severity}`] || THUMB_ICON_URL['severity_info'];
  string = string.replace("{{severityIcon}}", severityIconUrl);
  string = string.replace("{{url}}", errorMessage.url);
  string = string.replace("{{errorId}}", errorMessage.errorId);
  string = string.replace("{{projectId}}", errorMessage.projectId);
  string = string.replace("{{webhookId}}", webhookId);
  const card = JSON.parse(string);
  if (moreStackTrace.length > 0) {
    delete card.body[0].items[4].isVisible; //  set view more button visible
  }
  return card;
}

function formatErrorStateMessageIntoCard(errorMessage) {
  let string = errorStateString.replace("{{subject}}", errorMessage.subject);
  const { stackTrace, moreStackTrace } = splitStackTrace(errorMessage.stackTrace);
  const iconUrl = THUMB_ICON_URL[`collaborator_${errorMessage.stateChange}`] || THUMB_ICON_URL['collaborator'];
  string = string.replace("{{stateIcon}}", iconUrl);
  string = string.replace("{{stackTrace}}", stackTrace);
  string = string.replace("{{moreStackTrace}}", moreStackTrace);
  string = string.replace("{{releaseStage}}", capitalizeFirstLetter(errorMessage.releaseStage));
  string = string.replace("{{project}}", errorMessage.project);
  string = string.replace("{{severity}}", capitalizeFirstLetter(errorMessage.severity));
  string = string.replace("{{status}}", capitalizeFirstLetter(errorMessage.status));
  const statusIconUrl = THUMB_ICON_URL[`status_${errorMessage.status}`] || THUMB_ICON_URL['status_open'];
  string = string.replace("{{statusIcon}}", statusIconUrl);
  const severityIconUrl = THUMB_ICON_URL[`severity_${errorMessage.severity}`] || THUMB_ICON_URL['severity_info'];
  string = string.replace("{{severityIcon}}", severityIconUrl);
  string = string.replace("{{url}}", errorMessage.url);
  const card = JSON.parse(string);
  if (moreStackTrace.length > 0) {
    delete card.body[0].items[4].isVisible; //  set view more button visible
  }
  return card;
}

function formatCommentMessageIntoCard(commentMessage) {
  let string = commentString.replace("{{subject}}", commentMessage.subject);
  string = string.replace("{{comment}}", commentMessage.comment);
  const { stackTrace, moreStackTrace } = splitStackTrace(commentMessage.stackTrace);
  string = string.replace("{{stackTrace}}", stackTrace);
  string = string.replace("{{moreStackTrace}}", moreStackTrace);
  string = string.replace("{{releaseStage}}", capitalizeFirstLetter(commentMessage.releaseStage));
  string = string.replace("{{project}}", commentMessage.project);
  string = string.replace("{{severity}}", capitalizeFirstLetter(commentMessage.severity));
  string = string.replace("{{status}}", capitalizeFirstLetter(commentMessage.status));
  const statusIconUrl = THUMB_ICON_URL[`status_${commentMessage.status}`] || THUMB_ICON_URL['status_open'];
  string = string.replace("{{statusIcon}}", statusIconUrl);
  const severityIconUrl = THUMB_ICON_URL[`severity_${commentMessage.severity}`] || THUMB_ICON_URL['severity_info'];
  string = string.replace("{{severityIcon}}", severityIconUrl);
  string = string.replace("{{url}}", commentMessage.url);
  return JSON.parse(string);
}

function formatAdaptiveCardMessage(bugsnagMessage, webhookId) {
  const attachments = []
  let formattedMessage;
  if (bugsnagMessage.release) {
    formattedMessage = formatReleaseMessageV2(bugsnagMessage);
    const releaseCard = formatReleaseMessageIntoCard(formattedMessage);
    attachments.push(releaseCard);
  }
  if (bugsnagMessage.comment) {
    formattedMessage = formatCommentMessageV2(bugsnagMessage);
    const commentCard = formatCommentMessageIntoCard(formattedMessage);
    attachments.push(commentCard);
  } else if (bugsnagMessage.error) {
    let errorCard
    if (bugsnagMessage.trigger.type === 'errorStateManualChange') {
      formattedMessage = formatErrorStateMessageV2(bugsnagMessage);
      errorCard = formatErrorStateMessageIntoCard(formattedMessage);
    } else {
      formattedMessage = formatErrorMessageV2(bugsnagMessage);
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
  };
}

function createAuthTokenRequestCard({ webhookId }) {
  let string = authTokenString;
  string = string.replace("{{webhookId}}", webhookId);
  const card = JSON.parse(string);
  return {
    attachments: [card],
    icon: ICON_URL,
  };
}

exports.formatAdaptiveCardMessage = formatAdaptiveCardMessage;
exports.createAuthTokenRequestCard = createAuthTokenRequestCard;
