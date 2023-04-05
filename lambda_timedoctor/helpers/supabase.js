const knex = require('knex');

module.exports = knex({
  client: 'pg',
  pool: {
    min: 0,
    max: 7,
  },
  connection: {
    host: 'db.qszrlpquzvomtegibqkl.supabase.co',
    user: 'postgres',
    password: 'Mh5FVBkxVeNObleb',
    database: 'postgres',
    charset: 'utf8',
  },
});
