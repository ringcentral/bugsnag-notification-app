const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

// Add this table with 'webhooks' table for dynamodb query.
// Dynamodb only support to query data by primaryKey
exports.RCWebhook = sequelize.define('rc-webhooks', {
  id: {
    type: Sequelize.STRING,  // ringcentral webhook uri
    primaryKey: true,
  },
  bugsnag_webhook_id: { 
    type: Sequelize.STRING // identify for bugsnag webhooks callback uri
  },
});
