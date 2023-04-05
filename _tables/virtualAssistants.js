const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('hubspotId').nullable().index();

    table.text('firstName').notNullable().index();
    table.text('middleName').nullable();
    table.text('lastName').notNullable().index();
    table.date('applicationDate').nullable();
    table.boolean('registeredNurse').defaultTo(false).index();
    table.boolean('medicalDegree').defaultTo(false).index();
    table.boolean('hasExperience').defaultTo(false).index();
    table.string('category').index().notNullable();
    table.string('subCategory').index().notNullable();

    table.string('email').index().nullable();
    table.string('medvaEmail').index().nullable();
    table.string('phone').index().nullable();

    table.string('address').index().nullable();
    table.string('province').index().nullable();
    table.string('region').index().nullable();
    table.string('country').notNullable().index();

    table.date('birthdate').nullable().index();

    table.string('skype').nullable().index();
    table.string('status').nullable().index();

    table.text('avatar').nullable().index();
    table.text('video').nullable().index();
    table.text('resume').nullable().index();
  });
