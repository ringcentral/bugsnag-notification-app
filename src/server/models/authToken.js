const crypto = require('crypto');
const Sequelize = require('sequelize');
const { sequelize } = require('./sequelize');

const AuthToken = sequelize.define('authTokens', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  data: {
    type: Sequelize.STRING
  },
  encryptedData: {
    type: Sequelize.STRING
  },
});

function getCipherKey() {
  if (!process.env.APP_SERVER_SECRET_KEY) {
    throw new Error('APP_SERVER_SECRET_KEY is not defined');
  }
  if (process.env.APP_SERVER_SECRET_KEY.length < 32) {
    // pad secret key with spaces if it is less than 32 bytes
    return process.env.APP_SERVER_SECRET_KEY.padEnd(32, ' ');
  }
  if (process.env.APP_SERVER_SECRET_KEY.length > 32) {
    // truncate secret key if it is more than 32 bytes
    return process.env.APP_SERVER_SECRET_KEY.slice(0, 32);
  }
  return process.env.APP_SERVER_SECRET_KEY;
}

const originalSave = AuthToken.prototype.save;
AuthToken.prototype.save = async function () {
  if (this.data) {
    // encode data to encryptedData
    const cipher = crypto
      .createCipheriv('aes-256-cbc', getCipherKey(), Buffer.alloc(16, 0))
    this.encryptedData = cipher.update(this.data, 'utf8', 'hex') + cipher.final('hex');
    this.data = '';
  }
  return originalSave.call(this);
}

AuthToken.prototype.getDecryptedData = function () {
  if (!this.encryptedData) {
    // for backward compatibility
    return this.data;
  }
  // decode encryptedData to data
  const decipher = crypto
    .createDecipheriv('aes-256-cbc', getCipherKey(), Buffer.alloc(16, 0))
  return decipher.update(this.encryptedData, 'hex', 'utf8') + decipher.final('utf8');
}

AuthToken.prototype.removeData = function () {
  this.data = '';
  this.encryptedData = '';
}

exports.AuthToken = AuthToken;
