const { supabase } = require('../../helpers/supabase');

module.exports = async (db, form) => {
  const { table, column, keyword, select, order } = form;

  const { data, error } = await supabase
    .from(table)
    .select(select)
    .ilike(column, `%${keyword}%`)
    .order(order, { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return Array.isArray(data) ? data : [];
};
