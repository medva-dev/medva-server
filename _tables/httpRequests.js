const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('service').notNullable();
    table.text('method').notNullable();
    table.text('host').notNullable();
    table.text('path').notNullable();
    table.text('responseUrl');
    table.text('code');
    table.integer('status');
    table.text('statusText');
    table.text('message');
    table.jsonb('body').nullable();
    table.jsonb('response').nullable();
    table.timestamp('createdAt').defaultTo(transaction.fn.now()).index();
  });
};
