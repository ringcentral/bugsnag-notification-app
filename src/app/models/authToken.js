const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

exports.AuthToken = sequelize.define('authTokens', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  data: {
    type: Sequelize.STRING
  },
});
