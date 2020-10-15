const { createApp } = require('glip-integration-js');

const appConf = require('./app.js');

exports.server = createApp(appConf);
