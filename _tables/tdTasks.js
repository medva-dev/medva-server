const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.text('id').primary();
    table.text('tdProjectId').notNullable().index();
    table.text('name').notNullable().index();
    table.text('status').index();
    table.boolean('deleted').defaultTo(false);
    table.timestamp('createdAt').index().defaultTo(transaction.fn.now());

    table.foreign('tdProjectId').references('tdProjects.id');
  });
};
