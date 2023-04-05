const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.text('id').primary();
    table.text('creatorId').index().nullable();
    table.text('name').notNullable().index();
    table.text('special').index();
    table.integer('users').index().defaultTo(0);
    table.boolean('deleted').defaultTo(false);

    table.timestamp('createdAt').index().defaultTo(transaction.fn.now());

    table.foreign('creatorId').references('tdUsers.id');
  });
};
