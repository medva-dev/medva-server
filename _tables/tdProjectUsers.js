const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('tdProjectId').notNullable().index();
    table.text('tdUserId').notNullable().index();
    table.text('role');

    table.timestamp('createdAt').index().defaultTo(transaction.fn.now());

    table.unique(['tdProjectId', 'tdUserId']);

    table.foreign('tdProjectId').references('tdProjects.id');
    table.foreign('tdUserId').references('tdUsers.id');
  });
};
