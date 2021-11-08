const https = require('https');
const http = require('http');
const URL = require('url');

async function requestWithoutWaitingResponse(url, { method = 'GET', headers, body } = {}) {
  let transport = http;
  if (url.indexOf('https') === 0) {
    transport = https;
  }
  return new Promise((resolve, reject) => {
    const options = URL.parse(url);
    options.method = method;
    options.headers = headers;
    let req = transport.request(options);
    req.on('error', (e) => {
      reject(e.message);
    });
    req.end(body, null, () => {
      /* Request has been fully sent */
      resolve(req);
    });
  });
}

exports.requestWithoutWaitingResponse = requestWithoutWaitingResponse;
