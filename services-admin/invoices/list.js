const { tableListResult } = require('../../helpers/supabase');

module.exports = async (db, form) => {
  return tableListResult(form);
};
