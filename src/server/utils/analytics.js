const crypto = require('crypto');
const Mixpanel = require('mixpanel');

function getHashValue(string, secretKey) {
  return crypto.createHash('sha256').update(
    `${string}:${secretKey}`
  ).digest('hex');
}
class Analytics {
  constructor({
    mixpanelKey,
    secretKey,
    userId = undefined,
    accountId = undefined,
    appName = 'Bugsnag Bot',
    clientId = process.env.RINGCENTRAL_CHATBOT_CLIENT_ID,
  }) {
    if (mixpanelKey) {
      this._mixpanel = Mixpanel.init(mixpanelKey);
    }
    this._secretKey = secretKey;
    this._appName = appName;
    this._clientId = clientId;
    if (userId) {
      this._hashUserId = getHashValue(userId, secretKey);
    }
    if (accountId) {
      this._hashAccountId = getHashValue(accountId, secretKey);
    }
  }

  setAccountId(accountId) {
    this._hashAccountId = getHashValue(accountId, this._secretKey);
  }

  track(event, properties = {}) {
    if (!this._mixpanel) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this._mixpanel.track(event, {
        ...this.presetProperties,
        ...properties,
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  trackBotAction(action, properties = {}) {
    return this.track(action, {
      botEventType: 'bot',
      ...properties,
    });
  }

  trackUserAction(action, userId = null, props = {}) {
    const properties = {
      botEventType: 'user',
      ...props,
    };
    if (userId) {
      properties.userId = getHashValue(userId, this._secretKey);
    }
    return this.track(action, properties);
  }

  identify() {
    if (!this._mixpanel || !this._hashAccountId) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this._mixpanel.people.set(this._hashUserId, {
        rcAccountId: this._hashAccountId,
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  get presetProperties() {
    const properties = {
      appName: this._appName,
      distinct_id: this._hashUserId,
      botClientId: this._clientId,
    };
    if (this._hashAccountId) {
      properties.rcAccountId = this._hashAccountId;
    }
    return properties;
  }
}

exports.Analytics = Analytics;
