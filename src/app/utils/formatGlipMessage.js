const {
  formatReleaseMessage,
  formatErrorMessage,
  formatCommentMessage,
  formatErrorStateMessage,
} = require('./formatBugsnagMessage');

const FEEDBACK_URL = 'https://github.com/ringcentral/bugsnag-notification-app/issues/new';
const DEFAULT_FOOTER = `[Feedback (Any suggestions, or issues about the Bugsnag notification app?)](${FEEDBACK_URL})`;
const ICON_URL = 'https://github.com/ringcentral/bugsnag-notification-app/blob/main/icon/bugsnag-white.png?raw=true';
const FOOTER_ICON_URL = 'https://github.com/ringcentral/bugsnag-notification-app/blob/main/icon/feedback.png?raw=true';
const THUMB_ICON_BASE_URL = 'https://github.com/ringcentral/bugsnag-notification-app/blob/main/icon';
const THUMB_ICON_URL = {
  collaborator_fixed: `${THUMB_ICON_BASE_URL}/collaborator-fixed.png?raw=true`,
  collaborator_reopened: `${THUMB_ICON_BASE_URL}/collaborator-reopened.png?raw=true`,
  collaborator_snoozed: `${THUMB_ICON_BASE_URL}/collaborator-snooze.png?raw=true`,
  collaborator: `${THUMB_ICON_BASE_URL}/collaborator.png?raw=true`,
  comment: `${THUMB_ICON_BASE_URL}/comment.png?raw=true`,
  error: `${THUMB_ICON_BASE_URL}/error.png?raw=true`,
  general: `${THUMB_ICON_BASE_URL}/general.png?raw=true`,
  new: `${THUMB_ICON_BASE_URL}/new.png?raw=true`,
  release: `${THUMB_ICON_BASE_URL}/release.png?raw=true`,
  reopened: `${THUMB_ICON_BASE_URL}/reopened.png?raw=true`,
  repeated: `${THUMB_ICON_BASE_URL}/repeated.png?raw=true`,
};

function formatErrorMessageIntoCard(message) {
  const errorMessage = formatErrorMessage(message);
  let thumbUrl = THUMB_ICON_URL.error;
  if (message.trigger.type === 'errorEventFrequency' || message.trigger.type === 'powerTen') {
    thumbUrl = THUMB_ICON_URL.repeated;
  }
  if (message.trigger.type === 'reopened') {
    thumbUrl = THUMB_ICON_URL.reopened;
  }
  if (message.trigger.type === 'firstException') {
    thumbUrl = THUMB_ICON_URL.new;
  }
  return {
    type: 'Card',
    fallback: errorMessage.url,
    color: "#e45f58",
    intro: errorMessage.subject,
    fields: [
      {
        title: errorMessage.message,
        value: errorMessage.stackTrace,
        short: false
      },
      {
        title: "Severity",
        value: errorMessage.severity,
        short: true
      },
      {
        title: "Status",
        value: errorMessage.status,
        short: true
      }
    ],
    footer: DEFAULT_FOOTER,
    footer_icon: FOOTER_ICON_URL,
    thumb_url: thumbUrl,
  };
}

function formatErrorStateMessageIntoCard(message) {
  const errorMessage = formatErrorStateMessage(message);
  const thumbUrl = THUMB_ICON_URL[`collaborator_${message.trigger.stateChange}`];
  return {
    type: 'Card',
    fallback: errorMessage.url,
    color: "#2eb886",
    intro: errorMessage.subject,
    fields: [
      {
        title: errorMessage.message,
        value: errorMessage.stackTrace,
        short: false
      },
      {
        title: "Severity",
        value: errorMessage.severity,
        short: true
      },
      {
        title: "Status",
        value: errorMessage.status,
        short: true
      }
    ],
    footer: DEFAULT_FOOTER,
    footer_icon: FOOTER_ICON_URL,
    thumb_url: thumbUrl || THUMB_ICON_URL.collaborator,
  };
}

function formatReleaseMessageIntoCard(message) {
  const releaseMessage = formatReleaseMessage(message);
  const fields = [
    {
      title: "Version",
      value: releaseMessage.version,
      short: true,
    },
    {
      title: "Release Stage",
      value: releaseMessage.stage,
      style: "Short",
      short: true,
    }
  ];
  if (releaseMessage.by) {
    fields.push({
      title: "Release By",
      value: releaseMessage.by,
      style: "Short",
      short: true,
    });
  }
  if (releaseMessage.commit) {
    fields.push({
      title: "Commit",
      value: releaseMessage.commit,
      style: "Short",
      short: true,
    });
  }
  return {
    type: 'Card',
    fallback: releaseMessage.url,
    color: '#2eb886',
    intro: releaseMessage.subject,
    fields,
    footer: DEFAULT_FOOTER,
    footer_icon: FOOTER_ICON_URL,
    thumb_url: THUMB_ICON_URL.release,
  }
}

function formatCommentMessageIntoCard(message) {
  const commentMessage = formatCommentMessage(message);
  return {
    type: 'Card',
    fallback: commentMessage.url,
    color: '#ffa300',
    intro: commentMessage.subject,
    fields: [{
      title: commentMessage.errorMessage,
      value: commentMessage.stackTrace,
      short: false
    }, {
      title: 'Comment',
      value: commentMessage.comment,
      short: false,
    }],
    footer: DEFAULT_FOOTER,
    footer_icon: FOOTER_ICON_URL,
    thumb_url: THUMB_ICON_URL.comment,
  };
}

function formatGlipMessage(bugsnapMessage) {
  const attachments = []
  let title = `**${bugsnapMessage.trigger.message}** for [${bugsnapMessage.project.name}](${bugsnapMessage.project.url})`;
  if (bugsnapMessage.release) {
    const releaseCard = formatReleaseMessageIntoCard(bugsnapMessage);
    attachments.push(releaseCard);
    title = releaseCard.intro;
  }
  if (bugsnapMessage.comment) {
    const commentCard = formatCommentMessageIntoCard(bugsnapMessage);
    attachments.push(commentCard);
    title = commentCard.intro;
  } else if (bugsnapMessage.error) {
    let errorCard
    if (bugsnapMessage.trigger.type === 'errorStateManualChange') {
      errorCard = formatErrorStateMessageIntoCard(bugsnapMessage);
    } else {
      errorCard = formatErrorMessageIntoCard(bugsnapMessage);
    }
    attachments.push(errorCard);
    title = errorCard.intro;
  }
  return {
    title,
    attachments,
    icon: ICON_URL,
  };
}

exports.formatGlipMessage = formatGlipMessage;
