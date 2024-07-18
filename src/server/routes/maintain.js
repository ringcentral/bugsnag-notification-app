const { AuthToken } = require('../models/authToken');
const { errorLogger } = require('../utils/logger');

async function migrateEncryptedData(req, res) {
  if (!process.env.MAINTAIN_TOKEN) {
    res.status(404);
    res.send('Not found');
    return;
  }
  if (req.query.maintain_token !== process.env.MAINTAIN_TOKEN) {
    res.status(401);
    res.send('Token invalid');
    return;
  }
  try {
    const authTokens = await AuthToken.findAll();
    for (const authToken of authTokens) {
      if (authToken.data) {
        await authToken.save();
      }
    }
    res.status(200);
    res.send('migrated');
  } catch (e) {
    errorLogger(e);
    res.status(500);
    res.send('internal error');
  }
}

exports.migrateEncryptedData = migrateEncryptedData;
