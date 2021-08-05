const axios = require('axios');

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