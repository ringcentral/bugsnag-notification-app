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
    type: 'Card',
    fallback: message.error.url,
    color: "#e45f58",
    intro: subject,
    fields: [
      {
        title: "Unhandled error",
        value: `Error: ${message.error.message}`,
        style: "Long"
      },
      {
        title: "Location",
        value: location,
        style: "Long"
      }
    ]
  };
}

function formatReleaseMessage(message) {
  let subject = `**${message.trigger.message}** in **${message.release.releaseStage}**`;
  subject = `${subject} for [${message.project.name}](${message.project.url})`;
  subject = `${subject} ([view release](${message.release.url}))`;
  const fields = [
    {
      title: "Version",
      value: message.release.version,
      style: 'Short',
    },
    {
      title: "Release Stage",
      value: message.release.releaseStage,
      style: "Short",
    }
  ];
  if (message.release.releasedBy) {
    fields.push({
      title: "Release By",
      value: message.release.releasedBy,
      style: "Short",
    });
  }
  if (message.release.sourceControl) {
    let itemValue = message.release.sourceControl.revision.slice(0, 6);
    if (message.release.sourceControl.revisionUrl) {
      itemValue = `[${itemValue}](${message.release.sourceControl.revisionUrl})`;
    }
    if (message.release.sourceControl.diffUrl) {
      itemValue = `${itemValue} [(view diff)](${message.release.sourceControl.diffUrl})`;
    }
    fields.push({
      title: "Commit",
      value: itemValue,
      style: "Short",
    });
  }
  return {
    type: 'Card',
    fallback: message.release.url,
    color: "#2eb886",
    intro: subject,
    fields,
  }
}

function formatCommentMessage(message) {
  const subject = `**${message.trigger.message}** on ${message.error.exceptionClass}: ${message.error.message} ([details](${message.error.url}))`;
  return {
    type: 'Card',
    fallback: message.error.url,
    color: "#2eb886",
    intro: subject,
    fields: [{
      title: message.user.name,
      value: message.comment.message,
      style: "Long",
    }],
  }
}

function formatGlipMessage(bugsnapMessage) {
  const attachments = []
  let title = `**${bugsnapMessage.trigger.message}** for [${bugsnapMessage.project.name}](${bugsnapMessage.project.url})`;
  if (bugsnapMessage.release) {
    const releaseCard = formatReleaseMessage(bugsnapMessage);
    attachments.push(releaseCard);
    title = releaseCard.intro;
  }
  if (bugsnapMessage.comment) {
    const commentCard = formatCommentMessage(bugsnapMessage);
    attachments.push(commentCard);
    title = commentCard.intro;
  } else if (bugsnapMessage.error) {
    const errorCard = formatErrorMessage(bugsnapMessage);
    attachments.push(errorCard);
    title = errorCard.intro;
  }
  return {
    title,
    attachments,
  };
}

exports.formatGlipMessage = formatGlipMessage;
