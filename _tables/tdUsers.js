const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.text('id').primary().index();
    table.text('employeeId').index();
    table.text('name').notNullable().index();
    table.text('email').notNullable().index();
    table.text('role').notNullable().index();
    table.timestamp('hiredAt');
    table.timestamp('createdAt').index();
    table.jsonb('associatedIds').nullable().defaultTo({});
    table.boolean('active').index().defaultTo(true);
  });
};
