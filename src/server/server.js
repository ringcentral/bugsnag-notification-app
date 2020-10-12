const { createApp } = require('glip-integration-js');

const bugsnagAppConf = require('./bugsnag.js');
exports.server = createApp(bugsnagAppConf);
