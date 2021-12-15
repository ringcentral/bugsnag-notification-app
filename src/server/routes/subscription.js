const { Webhook } = require('../models/webhook');
const { RCWebhook } = require('../models/rc-webhook');

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
  res.render('new', {
    glipWebhookUri,
    analyticsKey: process.env.SEGMENT_KEY,
  });
}

async function createWebhook(req, res) {
  const rcWebhookUri = req.body.webhook;
  if (
    !rcWebhookUri ||
    (
      rcWebhookUri.indexOf('https://') !== 0 &&
      rcWebhookUri.indexOf('http://') !== 0
    )) {
    res.status(400);
    res.send('Params error');
    return;
  }
  let rcWebhook;
  let bugsnagWebhook;
  try {
    // We split RCWebhook and Webhook for querying in dynamodb
    rcWebhook = await RCWebhook.findByPk(rcWebhookUri);
    if (rcWebhook) {
      bugsnagWebhook = await Webhook.findByPk(rcWebhook.bugsnag_webhook_id);
    } else {
      rcWebhook = await RCWebhook.create({
        id: rcWebhookUri,
      });
    }
    if (!bugsnagWebhook) {
      bugsnagWebhook = await Webhook.create({
        rc_webhook: rcWebhookUri,
      });
      rcWebhook.bugsnag_webhook_id = bugsnagWebhook.id;
      await rcWebhook.save();
    }
    res.json({
      webhookUri: `${process.env.APP_SERVER}/notify/${bugsnagWebhook.id}`,
    });
  } catch (e) {
    console.error(e);
    res.status(500);
    res.send('Internal server error');
    return;
  }
}

exports.setup = setup;
exports.createWebhook = createWebhook;
