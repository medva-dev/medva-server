const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('subject').notNullable();
    table.jsonb('recipients').notNullable();
    table.text('body').nullable();
    table.text('response').nullable();
    table.text('error').nullable();
    table.datetime('createdAt').defaultTo(transaction.fn.now()).index();
  });
