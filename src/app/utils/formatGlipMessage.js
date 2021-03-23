const {
  formatReleaseMessage,
  formatErrorMessage,
  formatCommentMessage,
  formatErrorStateMessage,
} = require('./formatBugsnagMessage');

const FEEDBACK_URL = 'https://github.com/ringcentral/bugsnag-notification-app/issues/new';
const DEFAULT_FOOTER = `[Feedback (Any suggestions, or issues about the Bugsnag notification app?)](${FEEDBACK_URL})`;
const ICON_URL = 'https://github.com/ringcentral/bugsnag-notification-app/blob/main/icon/bugsnag-white.png?raw=true';
const FOOTER_ICON_URL = 'https://github.com/ringcentral/github-notification-app/blob/main/icons/feedback.png?raw=true';

function formatErrorMessageIntoCard(message) {
  const errorMessage = formatErrorMessage(message);
  return {
    type: 'Card',
    fallback: errorMessage.url,
    color: "#e45f58",
    intro: errorMessage.subject,
    fields: [
      {
        title: errorMessage.message,
        value: "",
        short: false
      },
      {
        title: "Stack Trace",
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
  };
}

function formatErrorStateMessageIntoCard(message) {
  const errorMessage = formatErrorStateMessage(message);
  return {
    type: 'Card',
    fallback: errorMessage.url,
    color: "#2eb886",
    intro: errorMessage.subject,
    fields: [
      {
        title: errorMessage.message,
        value: "",
        short: false
      },
      {
        title: "Stack Trace",
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
      title: 'Error',
      value: commentMessage.errorMessage,
      short: false,
    }, {
      title: 'Stack Trace',
      value: commentMessage.stackTrace,
      short: false
    }, {
      title: 'Comment',
      value: commentMessage.comment,
      short: false,
    }],
    footer: DEFAULT_FOOTER,
    footer_icon: FOOTER_ICON_URL,
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
