const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('tdProjectId').notNullable().index();
    table.text('tdUserId').notNullable().index();
    table.text('tdTaskId').notNullable().index();
    table.text('mode').notNullable().index();
    table.text('deviceId').notNullable().index();
    table.text('editTimeId').nullable().index();
    table.text('reason').nullable().index();
    table.timestamp('start').notNullable().index();
    table.integer('time').index();

    table.timestamp('createdAt').index().defaultTo(transaction.fn.now());

    table.foreign('tdProjectId').references('tdProjects.id');
    table.foreign('tdUserId').references('tdUsers.id');
    table.foreign('tdTaskId').references('tdTasks.id');

    table.unique(['tdUserId', 'start']);
  });
};
