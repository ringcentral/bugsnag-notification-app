const Sequelize = require('sequelize');
const { generate } = require('shortid');
const { sequelize } = require('./sequelize');

exports.Webhook = sequelize.define('webhooks', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    defaultValue: generate,
  },
  rc_webhook: {
    type: Sequelize.STRING
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});
