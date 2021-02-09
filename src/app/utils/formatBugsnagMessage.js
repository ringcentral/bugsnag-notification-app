function formatTriggerType(trigger) {
  if (trigger.type === 'exception') {
    return 'Exception';
  }
  if (trigger.type === 'firstException') {
    return 'New error';
  }
  if (trigger.type === 'powerTen') {
    return trigger.message;
  }
  if (trigger.type === 'errorEventFrequency') {
    return `Repeated error (${trigger.message})`;
  }
  if (trigger.type === 'reopened') {
    return 'Reopened error';
  }
  if (trigger.type === 'errorStateManualChange') {
    return `Collaborator state change (${trigger.stateChange})`
  }
  return trigger.message;
}

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

function formatErrorStackTrace(error) {
  let stackTrace = [];
  if (error.stackTrace) {
    error.stackTrace.forEach((stack) => {
      stackTrace.push(`*  ${stack.file}:${stack.lineNumber} - ${stack.method}`);
    });
  } else {
    stackTrace.push(error.requestUrl);
  }
  stackTrace = stackTrace.join('\n');
  return stackTrace;
}

function formatErrorMessage(message) {
  let subject = `**${formatTriggerType(message.trigger)}** in **${message.error.releaseStage}**`;
  subject = `${subject} from [${message.project.name}](${message.project.url})`;
  subject = `${subject} in ${message.error.context} ([details](${message.error.url}))`;
  return {
    subject,
    message: message.error.message,
    stackTrace: formatErrorStackTrace(message.error),
    severity: message.error.severity,
    status: message.error.status,
    url: message.error.url,
  }
}

function formatErrorStateMessage(message) {
  let subject = `**${formatTriggerType(message.trigger)} by ${message.user.name}**`;
  subject = `${subject} from [${message.project.name}](${message.project.url})`;
  subject = `${subject} in ${message.error.context} ([details](${message.error.url}))`;
  return {
    subject,
    message: message.error.message,
    stackTrace: formatErrorStackTrace(message.error),
    severity: message.error.severity,
    status: message.error.status,
    url: message.error.url,
  }
}

function formatCommentMessage(message) {
  const errorMessage = `${message.error.exceptionClass}: ${message.error.message}`;
  const subject = `${message.user.name} commented on ${errorMessage} ([details](${message.error.url}))`;

  return {
    url: message.error.url,
    subject,
    errorMessage,
    stackTrace: formatErrorStackTrace(message.error),
    comment: message.comment.message,
  };
}

exports.formatErrorMessage = formatErrorMessage;
exports.formatReleaseMessage = formatReleaseMessage;
exports.formatCommentMessage = formatCommentMessage;
exports.formatErrorStateMessage = formatErrorStateMessage;
