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

const ACTION_DESCRIPTIONS = {
  fix: 'Fixed',
  open: 'Reopened',
  ignore: 'Ignored',
  snooze: 'Snoozed',
};

const SNOOZE_TYPE_DESCRIPTIONS = {
  '1hr': 'After 1 hour',
  '6hr': 'After 6 hours',
  '1d': 'After 1 day',
  '1_time': 'After 1 time',
  '10_times': 'After 10 times',
  '100_times': 'After 100 times',
  '1000_times': 'After 1000 times',
  '1_in_1_hr': 'Least 1 time per hr',
  '10_in_1_hr': 'Least 10 times per hr',
  '100_in_1_hr': 'Least 100 times per hr',
  '1000_in_1_hr': 'Least 1000 times per hr',
};

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

  async operate({ action, data }) {
    if (action === 'fix') {
      await this.makeAsFixed();
    }
    if (action === 'ignore') {
      await this.ignore();
    }
    if (action === 'snooze') {
      await this.snooze({ type: data.snoozeType });
    }
    if (action === 'open') {
      await this.open();
    }
    const comment = (
      data.fixComment ||
      data.snoozeComment ||
      data.ignoreComment ||
      data.openComment ||
      data.comment
    );
    if (comment) {
      await this.comment({ message: comment });
    }
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
      'X-Version': '2',
    };
  }
}

exports.Bugsnag = Bugsnag;
exports.ACTION_DESCRIPTIONS = ACTION_DESCRIPTIONS;
exports.SNOOZE_TYPE_DESCRIPTIONS = SNOOZE_TYPE_DESCRIPTIONS;
