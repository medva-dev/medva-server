const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.integer('invoiceId').index();
    table.integer('invoiceItemId').index();
    table.integer('timesheetId').notNullable().index();

    table.foreign('invoiceId').references('invoices.id');
    table.foreign('invoiceItemId').references('invoiceItems.id');
    table.foreign('timesheetId').references('timesheets.id');
  });
};
