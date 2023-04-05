const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.text('id').primary();
    table.text('clientId').index().nullable();
    table.text('name').notNullable().index();
    table.text('creatorId').notNullable().index();
    table.boolean('deleted').defaultTo(false);
    table.text('scope').notNullable().index();
    table.timestamp('createdAt').index().defaultTo(transaction.fn.now());

    table.foreign('creatorId').references('tdUsers.id');
    table.foreign('clientId').references('clients.id');
  });
};
