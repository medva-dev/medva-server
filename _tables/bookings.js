const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('clientId').notNullable().index();
    table.integer('virtualAssistantId').notNullable().index();
    table.text('timezone').nullable().index();
    table.timestamp('dateTime').index().notNullable();
    // table.date('date').notNullable();
    // table.time('time', { precision: 4 }).notNullable();
    table.text('status').index().defaultTo('active');
    table.timestamp('createdAt').defaultTo(transaction.fn.now()).index();

    table.text('zoomId').index().nullable();
    table.text('zoomPassword').index().nullable();
    table.text('zoomLink').index().nullable();
    table.text('zoomError').nullable();

    table.foreign('clientId').references('clients.id');
    table.foreign('virtualAssistantId').references('virtualAssistants.id');
  });
