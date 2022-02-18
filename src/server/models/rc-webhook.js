const Sequelize = require('sequelize');
const { nanoid } = require('nanoid')
const { sequelize } = require('./sequelize');

// Add this table with 'webhooks' table for dynamodb query.
// Dynamodb only support to query data by primaryKey
exports.RCWebhook = sequelize.define('rcWebhooks', {
  id: {
    type: Sequelize.STRING,  // ringcentral webhook id
    primaryKey: true,
  },
  bugsnag_webhook_id: { 
    type: Sequelize.STRING, // identify for bugsnag webhooks callback uri
    defaultValue: (length = 15) => nanoid(length),
  },
  rc_webhook_uri: {
    type: Sequelize.STRING, // ringcentral webhook uri
  },
});
