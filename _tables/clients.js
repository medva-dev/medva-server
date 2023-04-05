const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.text('id').primary();
    table.text('email').notNullable();
    table.text('name').notNullable();
    table.text('companyName').nullable();
    table.text('dealType').nullable();
    table.text('stage').nullable();
    table.text('referral').nullable();
    table.text('clinicAddress').nullable();
    table.text('clinicState').nullable();
    table.text('specialty').nullable();
    table.text('ehr').nullable();
    table.text('voip').nullable();
    table.text('associatedCompany').nullable();
    table.text('associatedContact').nullable();
    table.text('avatarUrl').nullable();
    table.text('timezone').nullable();
    table.integer('offset').nullable();
    table.timestamp('createdAt').defaultTo(transaction.fn.now()).index();
  });
