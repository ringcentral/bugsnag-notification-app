/**
 * main file for lambda
 */
const serverlessHTTP = require('serverless-http');
const { server } = require('./server');

exports.app = serverlessHTTP(server);
