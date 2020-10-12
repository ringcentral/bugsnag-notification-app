/**
 * main file for lambda
 */
const serverlessHTTP = require('serverless-http');
const { server } = require('./server');

export const app = serverlessHTTP(server);
