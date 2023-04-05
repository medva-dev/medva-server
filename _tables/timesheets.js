const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.date('date').notNullable().index();
    table.text('tdProjectId').notNullable().index();
    table.text('tdUserId').notNullable().index();

    table.integer('seconds').notNullable().index();
    table.decimal('hours', 4, 2).notNullable().index();
    table.decimal('approvedHours', 4, 2).index();

    table.decimal('ratePerHour', 5, 2).notNullable().index();
    table.decimal('total', 8, 2).notNullable().index();

    table.text('status').notNullable().index().defaultTo('approved');
    table.timestamp('createdAt').index().defaultTo(transaction.fn.now());

    table.foreign('tdProjectId').references('tdProjects.id');
    table.foreign('tdUserId').references('tdUsers.id');

    table.unique(['date', 'tdProjectId', 'tdUserId']);
  });
};
