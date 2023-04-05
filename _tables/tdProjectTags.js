const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('tdProjectId').notNullable().index();
    table.text('tdTagId').notNullable().index();

    table.unique(['tdProjectId', 'tdTagId']);

    table.foreign('tdProjectId').references('tdProjects.id');
    table.foreign('tdTagId').references('tdTags.id');
  });
};
