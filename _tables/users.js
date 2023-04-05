const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.uuid('uid').primary();
    table.text('name').nullable().index();
    table.text('email').notNullable().index();
    table.text('avatarUrl').nullable();
    table.text('provider').nullable().index();
    table.uuid('createdBy').index().nullable();
    table.datetime('createdAt').defaultTo(transaction.fn.now());
    table.datetime('lastSignIn').nullable();
    table.boolean('forceChangePassword').defaultTo(false);
    table.boolean('isSuperuser').defaultTo(false);
    table.jsonb('extra').nullable();
    table.text('googleRefreshToken').nullable();
  });
};
