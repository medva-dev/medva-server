const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.integer('invoiceId').index();
    table.text('tdProjectId').notNullable().index();
    table.text('tdUserId').notNullable().index();

    table.date('startDate').notNullable().index();
    table.date('endDate').notNullable().index();

    table.decimal('totalHours', 6, 2).notNullable().index();
    table.decimal('ratePerHour', 4, 2).notNullable().index();
    table.decimal('totalPay', 10, 2).notNullable().index();

    table.foreign('tdProjectId').references('tdProjects.id');
    table.foreign('tdUserId').references('tdUsers.id');
    table.foreign('invoiceId').references('invoices.id');
  });
};
