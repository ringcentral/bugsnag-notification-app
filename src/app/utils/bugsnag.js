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
    return this._updateError({ operation: 'fix' });
  }

  ignore() {
    return this._updateError({ operation: 'ignore' });
  }

  open() {
    return this._updateError({ operation: 'open' });
  }

  snooze({ type }) {
    return this._updateError({
      operation: 'snooze',
      reopen_rules: {
        reopen_if: 'occurs_after',
        seconds: getSnoozeSeconds(type),
      },
    });
  }

  comment({ message }) {
    return axios.post(
      `${this._apiUrl}/comments`,
      { message },
      { headers: this._getHeaders() },
    );
  }

  _updateError(body) {
    return axios.patch(
      this._apiUrl,
      body,
      { headers: this._getHeaders() },
    );
  }

  _getHeaders() {
    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `token ${this._authToken}`,
    };
  }
}

exports.Bugsnag = Bugsnag;