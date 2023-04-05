const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.integer('virtualAssistantId').notNullable().index();
    table.text('name').notNullable();
    table.date('from').nullable();
    table.date('to').nullable();
    table.foreign('virtualAssistantId').references('virtualAssistants.id');
  });
