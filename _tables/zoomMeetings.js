const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.text('id').primary().notNullable();
    table.text('uuid').notNullable().index();
    table.text('operatorId').notNullable().index();
    table.text('topic').notNullable().index();
    table.integer('duration').notNullable().index();
    table.integer('allowance').notNullable().index();
    table.datetime('startTime').notNullable().index();
    table.datetime('endTime').notNullable().index();
    table.text('timezone').notNullable().index();
    table.text('joinUrl').notNullable().index();
    table.text('password').nullable().index();
    table.text('status').nullable().index();
    table.datetime('createdAt').defaultTo(transaction.fn.now());
    table.datetime('startedAt').nullable().index();
    table.datetime('endedAt').nullable().index();
    table.datetime('lastUpdateAt').defaultTo(transaction.fn.now());

    table.foreign('operatorId').references('zoomUsers.id');
  });
};
