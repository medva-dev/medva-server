const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) =>
  transaction.schema.createTable(name, (table) => {
    table.increments('id').primary();
    table.text('zoomMeetingId').notNullable().index();
    table.text('googleCalendarId').notNullable().index();
    table.json('response').nullable();

    table.timestamp('createdAt').defaultTo(transaction.fn.now());

    table.foreign('zoomMeetingId').references('zoomMeetings.id');
  });
