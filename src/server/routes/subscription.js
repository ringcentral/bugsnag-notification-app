const { Webhook } = require('../models/webhook');
const { RCWebhook } = require('../models/rc-webhook');
const { errorLogger } = require('../utils/logger');

// Setup page for install add-in
async function setup(req, res) {
  const glipWebhookUri = req.query.webhook;
  if (
    !glipWebhookUri ||
    (
      glipWebhookUri.indexOf('https://') !== 0 &&
      glipWebhookUri.indexOf('http://') !== 0
    )
  ) {
    res.status(404);
    res.send('Webhook uri is required.');
    return;
  }
  const IFRAME_HOST_DOMAINS = "https://*.ringcentral.com https://*.ringcentral.biz https://*.glip.com https://*.glip.net https://glip.com https://*.labs.ringcentral.com http://*.integration.ringcentral.com http://*.devtest.ringcentral.com https://*.unifyoffice.com https://*.officeathand.att.com https://*.cloudoffice.avaya.com https://*.cloudwork.bt.com https://*.rainbowoffice.com https://*.businessconnect.telus.com https://*.vodafonebusiness.ringcentral.com";
  res.set('Content-Security-Policy', `frame-ancestors 'self' ${IFRAME_HOST_DOMAINS};`);
  res.render('new', {
    glipWebhookUri,
    analyticsKey: process.env.MIXPANEL_KEY,
  });
}

function getRCWebhookId(rcWebhookUri) {
  if (
    !rcWebhookUri ||
    (
      rcWebhookUri.indexOf('https://') !== 0 &&
      rcWebhookUri.indexOf('http://') !== 0
    )) {
    return null;
  }
  const uriWithoutQuery = rcWebhookUri.split('?')[0];
  const uriWithoutHash = uriWithoutQuery.split('#')[0];
  const paths = uriWithoutHash.split('/');
  return paths[paths.length - 1];
}

async function createWebhook(req, res) {
  const rcWebhookUri = req.body.webhook;
  const rcWebhookId = getRCWebhookId(rcWebhookUri);
  if (!rcWebhookId) {
    res.status(400);
    res.send('Params error');
    return;
  }
  let rcWebhook;
  let bugsnagWebhook;
  try {
    // We split RCWebhook and Webhook for querying in dynamodb
    rcWebhook = await RCWebhook.findByPk(rcWebhookId);
    if (rcWebhook) {
      bugsnagWebhook = await Webhook.findByPk(rcWebhook.bugsnag_webhook_id);
    } else {
      rcWebhook = await RCWebhook.create({
        id: rcWebhookId,
        rc_webhook_uri: rcWebhookUri,
      });
    }
    if (!bugsnagWebhook) {
      bugsnagWebhook = await Webhook.create({
        id: rcWebhook.bugsnag_webhook_id,
        rc_webhook: rcWebhookUri,
      });
    } else {
      if (bugsnagWebhook.rc_webhook !== rcWebhookUri) {
        bugsnagWebhook.rc_webhook = rcWebhookUri;
        await bugsnagWebhook.save();
      }
    }
    res.json({
      webhookUri: `${process.env.APP_SERVER}/notify/${bugsnagWebhook.id}`,
    });
  } catch (e) {
    errorLogger(e);
    res.status(500);
    res.send('Internal server error');
    return;
  }
}

exports.setup = setup;
exports.createWebhook = createWebhook;
