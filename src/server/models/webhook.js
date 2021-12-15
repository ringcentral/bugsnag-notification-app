const Sequelize = require('sequelize');
const { generate } = require('shortid');
const { sequelize } = require('./sequelize');

exports.Webhook = sequelize.define('webhooks', {
  id: {
    type: Sequelize.STRING, // identify for bugsnag webhooks callback uri
    primaryKey: true,
    defaultValue: generate,
  },
  rc_webhook: {            // ringcentral webhook uri
    type: Sequelize.STRING
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});
