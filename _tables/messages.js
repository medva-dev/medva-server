const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('clientId').index();
    table.uuid('userId').index().nullable();
    table.text('message').index().notNullable();
    table.datetime('createdAt').index().defaultTo(transaction.fn.now());
    table.datetime('seenAt').index().nullable();
    table.datetime('updatedAt').index().defaultTo(transaction.fn.now());

    table.foreign('clientId').references('clients.id');
    table.foreign('userId').references('users.uid');
  });
};
