// main file for local server
require('dotenv').config()

const { server } = require('./server');
// import initDb from './app/common/init-db';

const {
  APP_PORT: port,
  APP_HOST: host,
  APP_HOME = '/'
} = process.env;

server.listen(port, host, () => {
  console.log(`-> server running at: http://${host}:${port}${APP_HOME}`);
  // initDb();
});
