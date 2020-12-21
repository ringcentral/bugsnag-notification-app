const {
  formatReleaseMessage,
  formatErrorMessage,
  formatCommentMessage,
} = require('./formatBugsnagMessage');

const FEEDBACK_URL = 'https://github.com/ringcentral/bugsnag-notification-app/issues/new';
const DEFAULT_FOOTER = `[Feedback (Any suggestions, or issues about the Bugsnag notification app?)](${FEEDBACK_URL})`;
function formatErrorMessageIntoCard(message) {
  const errorMessage = formatErrorMessage(message);
  return {
    type: 'Card',
    fallback: errorMessage.url,
    color: "#e45f58",
    intro: errorMessage.subject,
    fields: [
      {
        title: "Unhandled error",
        value: errorMessage.message,
        style: "Long"
      },
      {
        title: "Location",
        value: errorMessage.location,
        style: "Long"
      }
    ],
    footer: DEFAULT_FOOTER,
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
    color: "#2eb886",
    intro: releaseMessage.subject,
    fields,
    footer: DEFAULT_FOOTER,
  }
}

function formatCommentMessageIntoCard(message) {
  const commentMessage = formatCommentMessage(message);
  return {
    type: 'Card',
    fallback: commentMessage.url,
    color: "#2eb886",
    intro: commentMessage.subject,
    fields: [{
      title: commentMessage.userName,
      value: commentMessage.comment,
      style: "Long",
    }],
    footer: DEFAULT_FOOTER,
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
    const errorCard = formatErrorMessageIntoCard(bugsnapMessage);
    attachments.push(errorCard);
    title = errorCard.intro;
  }
  return {
    title,
    attachments,
  };
}

exports.formatGlipMessage = formatGlipMessage;
