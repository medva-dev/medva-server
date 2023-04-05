const dotenv = require('dotenv');
const path = require('path');
const knex = require('knex');

if (!process.env.DB_HOST) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

module.exports = knex({
  client: 'pg',
  client: process.env.DB_CLIENT || 'pg',
  pool: {
    min: Number(process.env.DB_MIN_POOL) || 0,
    max: Number(process.env.DB_MAX_POOL) || 7,
  },
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET,
  },
});
