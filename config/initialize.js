const path = require('path');

const env = path.join(__dirname, '../', '.env');
const dotenv = require('dotenv');

dotenv.config({ path: env });

const config = {};

const initialize = () => {
  console.log('Checking environment variables');
  const variables = [
    'API_PATH',
    'API_PORT',
    'CLIENT_APP_URL',
    'ADMIN_CLIENT_APP_URL',
  ];

  const missing = [];

  variables.forEach((key) => {
    if (typeof process.env[key] === 'undefined') {
      missing.push(key);
    }
    config[key] = process.env[key];
  });

  if (missing.length > 0) {
    console.log('Missing environment variables:', missing);
    process.exit();
  }

  console.log('Config successfully initialized');
};

initialize();

module.exports = config;
