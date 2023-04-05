const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('tdTagId').notNullable().index();
    table.text('tdUserId').notNullable().index();

    table.unique(['tdTagId', 'tdUserId']);

    table.foreign('tdTagId').references('tdTags.id');
    table.foreign('tdUserId').references('tdUsers.id');
  });
};
