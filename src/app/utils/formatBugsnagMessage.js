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

function formatErrorStackTrace(error, bullet) {
  let stackTrace = [];
  if (error.stackTrace) {
    let line = 0;
    error.stackTrace.forEach((stack) => {
      line++;
      if (line > 10) {
        return;
      }
      if (bullet) {
        stackTrace.push(`${bullet} ${stack.file}:${stack.lineNumber} - ${stack.method}`);
      } else {
        stackTrace.push(`${stack.file}:${stack.lineNumber} - ${stack.method}`);
      }
    });
  } else {
    stackTrace.push(error.requestUrl);
  }
  stackTrace = stackTrace.join('\n');
  return stackTrace;
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

function formatErrorMessage(message) {
  let subject = `**${formatTriggerType(message.trigger)}** in **${message.error.releaseStage}**`;
  subject = `${subject} from [${message.project.name}](${message.project.url})`;
  subject = `${subject} in ${message.error.context} ([details](${message.error.url}))`;
  return {
    subject,
    message: message.error.message,
    stackTrace: formatErrorStackTrace(message.error, '*'),
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
    stackTrace: formatErrorStackTrace(message.error, '*'),
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
    stackTrace: formatErrorStackTrace(message.error, '*'),
    comment: message.comment.message,
  };
}


function formatReleaseMessageV2(message) {
  let subject = `**${message.trigger.message}** in **${message.release.releaseStage}**`;
  subject = `${subject} for [${message.project.name}](${message.project.url})`;
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

function formatErrorMessageV2(message) {
  let subject = `**${formatTriggerType(message.trigger)}** in **${message.error.releaseStage}**`;
  subject = `${subject} from [${message.project.name}](${message.project.url})`;
  subject = `${subject} in ${message.error.context}`;
  return {
    subject,
    type: message.error.type,
    message: `[${message.error.message}](${message.error.url})`,
    stackTrace: formatErrorStackTrace(message.error),
    severity: message.error.severity,
    status: message.error.status,
    url: message.error.url,
  };
}

function formatErrorStateMessageV2(message) {
  let subject = `${message.user.name} marked`;
  subject = `${subject} \\"[${message.error.message}](${message.error.url})\\"`;
  subject = `${subject} ${message.trigger.stateChange}`;
  return {
    subject,
    message: message.error.message,
    stackTrace: formatErrorStackTrace(message.error),
    releaseStage: message.error.releaseStage,
    severity: message.error.severity,
    project: `[${message.project.name}](${message.project.url})`,
    status: message.error.status,
    stateChange: message.trigger.stateChange,
    url: message.error.url,
  };
}

function formatCommentMessageV2(message) {
  const subject = `**${message.user.name} commented** on [${message.error.message}](${message.error.url})`;

  return {
    url: message.error.url,
    subject,
    stackTrace: formatErrorStackTrace(message.error),
    comment: message.comment.message,
    releaseStage: message.error.releaseStage,
    severity: message.error.severity,
    project: `[${message.project.name}](${message.project.url})`,
    status: message.error.status,
  };
}

exports.formatErrorMessage = formatErrorMessage;
exports.formatReleaseMessage = formatReleaseMessage;
exports.formatCommentMessage = formatCommentMessage;
exports.formatErrorStateMessage = formatErrorStateMessage;
exports.formatErrorMessageV2 = formatErrorMessageV2;
exports.formatReleaseMessageV2 = formatReleaseMessageV2;
exports.formatCommentMessageV2 = formatCommentMessageV2;
exports.formatErrorStateMessageV2 = formatErrorStateMessageV2;
