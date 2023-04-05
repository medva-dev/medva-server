const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.text('id').primary().notNullable();
    table.text('accountId').nullable().index();
    table.uuid('userId').nullable().index();
    table.text('firstName').notNullable().index();
    table.text('lastName').notNullable().index();
    table.text('displayName').notNullable().index();
    table.text('email').notNullable().index();
    table.text('department').nullable().index();
    table.text('roleName').nullable().index();
    table.text('timezone').notNullable().index();
    table.datetime('createdAt').defaultTo(transaction.fn.now());
    table.datetime('zoomCreatedAt').notNullable();
    table.integer('assignedMeetingsCounter').notNullable().index().defaultTo(0);

    table.foreign('userId').references('users.uid');
  });
};
