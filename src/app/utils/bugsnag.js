const axios = require('axios');

function getSnoozeSeconds(type) {
  const hour = 3600;
  if (type === '6hr') {
    return 6 * hour;
  }
  if (type === '1d') {
    return 24 * hour;
  }
  return hour;
}

class Bugsnag {
  constructor({ authToken, projectId, errorId }) {
    this._authToken = authToken;
    this._projectId = projectId;
    this._errorId = errorId;
    this._apiUrl = `https://api.bugsnag.com/projects/${projectId}/errors/${errorId}`;
  }

  makeAsFixed() {
    return this._sendRequest({ operation: 'fix' });
  }

  ignore() {
    return this._sendRequest({ operation: 'ignore' });
  }

  snooze({ type }) {
    return this._sendRequest({
      operation: 'snooze',
      reopen_rules: {
        reopen_if: 'occurs_after',
        seconds: getSnoozeSeconds(type),
      },
    });
  }

  _sendRequest(body) {
    return axios.patch(
      this._apiUrl,
      body,
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `token ${this._authToken}`,
        },
      }
    );
  }
}

exports.Bugsnag = Bugsnag;