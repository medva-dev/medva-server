const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('fileName').notNullable().index();
    table.text('virtualAssistantName').nullable().index();
    table.text('rawVideoLocation').notNullable().index();
    table.text('renderedVideoLocation').nullable().index();
    table.integer('duration').notNullable().index();
    table.datetime('createdAt').defaultTo(transaction.fn.now());
    table.datetime('renderedAt').nullable();
    table.jsonb('status').nullable();
    table.text('error').nullable();
  });
};
