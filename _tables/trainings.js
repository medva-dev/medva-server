const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.integer('virtualAssistantId').notNullable().index();
    table.text('name').index().nullable();
    table.json('extra').nullable();

    table.foreign('virtualAssistantId').references('virtualAssistants.id');
  });
