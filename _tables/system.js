const name = require('path').basename(__filename).split('.')[0];

module.exports = async (transaction) => {
  await transaction.schema.createTable(name, (table) => {
    table.text('name').primary();
    table.jsonb('value').nullable();
  });
};
