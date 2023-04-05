const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    id: joi.number().required().positive(),
  })
  .options({
    stripUnknown: true,
  });

module.exports = async (db, data, user) => {
  const { id } = await schema.validateAsync(data);

  const { data: details } = await supabase
    .from('invoiceItemDetails')
    .select('timesheets(date, approvedHours, tdUsers(name), tdProjects(name))')
    .eq('invoiceItemId', id);

  return details || [];
};
