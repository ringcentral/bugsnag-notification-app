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

function getReopenRules(type) {
  const rules = {};
  if (type.indexOf('in') > -1) {
    rules.reopen_if = 'n_occurrences_in_m_hours';
    const parsed = type.split('_');
    rules.occurrences = Number.parseInt(parsed[0]);
    rules.hours = Number.parseInt(parsed[2]);
  } else if (type.indexOf('time') > -1) {
    rules.reopen_if = 'n_additional_occurrences';
    const parsed = type.split('_');
    rules.additional_occurrences = Number.parseInt(parsed[0]);
  } else {
    rules.reopen_if = 'occurs_after';
    rules.seconds = getSnoozeSeconds(type);
  }
  return rules;
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
      reopen_rules: getReopenRules(type),
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