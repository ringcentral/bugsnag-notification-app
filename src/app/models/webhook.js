const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

exports.Webhook = sequelize.define('webhooks', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4
  },
  rc_webhook: {
    type: Sequelize.STRING
  },
  bs_auth_token: {
    type: Sequelize.STRING
  },
  enabled: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});
