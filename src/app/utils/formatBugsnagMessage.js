function formatReleaseMessage(message) {
  let subject = `**${message.trigger.message}** in **${message.release.releaseStage}**`;
  subject = `${subject} for [${message.project.name}](${message.project.url})`;
  subject = `${subject} ([view release](${message.release.url}))`;
  let commit;
  if (message.release.sourceControl) {
    commit = message.release.sourceControl.revision.slice(0, 6);
    if (message.release.sourceControl.revisionUrl) {
      commit = `[${commit}](${message.release.sourceControl.revisionUrl})`;
    }
    if (message.release.sourceControl.diffUrl) {
      commit = `${commit} [(view diff)](${message.release.sourceControl.diffUrl})`;
    }
  }
  return {
    subject,
    url: message.release.url,
    version: message.release.version,
    stage: message.release.releaseStage,
    by: message.release.releasedBy,
    commit,
  };
}

function formatErrorMessage(message) {
  let subject = `**${message.trigger.message}** in **${message.error.releaseStage}**`;
  subject = `${subject} from [${message.project.name}](${message.project.url})`;
  subject = `${subject} in ${message.error.context} ([details](${message.error.url}))`;
  let location = [];
  if (message.error.stackTrace) {
    message.error.stackTrace.forEach((stack) => {
      location.push(`${stack.file}:`);
      location.push(`${stack.lineNumber} - ${stack.method}`);
    });
  } else {
    location.push(message.error.requestUrl);
  }
  location = location.join('\n');
  return {
    subject,
    message: `Error: ${message.error.message}`,
    location,
    url: message.error.url,
  }
}

function formatCommentMessage(message) {
  const subject = `**${message.trigger.message}** on ${message.error.exceptionClass}: ${message.error.message} ([details](${message.error.url}))`;

  return {
    url: message.error.url,
    subject,
    userName: message.user.name,
    comment: message.comment.message,
  };
}

exports.formatErrorMessage = formatErrorMessage;
exports.formatReleaseMessage = formatReleaseMessage;
exports.formatCommentMessage = formatCommentMessage;

