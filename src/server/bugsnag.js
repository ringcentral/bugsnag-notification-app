const axios = require('axios');

exports.appExtend = (app) => {
  app.post('/bugsnag', async (req, res) => {
    const body = req.body;
    console.log(body);
    const glipRes = await axios.post(process.env.STATIC_WEBHOOK, {
      text: 'Now',
      body: 'test'
    }, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    res.send('ok');
  });
}
