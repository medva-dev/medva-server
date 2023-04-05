const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('tdProjectId').notNullable().index();

    table.date('date').notNullable().index();
    table.date('dueDate').notNullable().index();

    table.decimal('subTotal', 10, 2).notNullable().index();
    table.jsonb('extra').nullable();

    table.decimal('total', 10, 2).notNullable().index();

    table.timestamp('createdAt').index().defaultTo(transaction.fn.now());
    table.timestamp('paidAt').index().nullable();
    table.text('status').index().defaultTo('unpaid');

    table.foreign('tdProjectId').references('tdProjects.id');
  });
};
