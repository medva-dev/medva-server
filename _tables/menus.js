const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.integer('order').default(0).index();
    table.text('key').unique().notNullable();
    table.text('title').notNullable();
    table.text('location').notNullable().unique().index();
    table.text('label').notNullable().index();
    table.text('component').notNullable().index();
    table.text('iconLibrary').nullable().index();
    table.text('iconComponent').nullable().index();
    table.boolean('superuserOnly').default(false);
    table.specificType('children', 'jsonb ARRAY');
    // table.jsonb('actions').nullable(); // any type of actions inside this menu
    // table.jsonb('children').nullable();
  });
