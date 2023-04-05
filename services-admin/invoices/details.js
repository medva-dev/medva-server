const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    invoiceId: joi.number().required().positive(),
  })
  .options({
    stripUnknown: true,
  });

module.exports = async (db, data, user) => {
  const { invoiceId } = await schema.validateAsync(data);

  const { data: details } = await supabase
    .from('invoices')
    .select(
      '*, tdProjects(name, clients(name)), invoiceItems(*, tdUsers(name) ) '
    )
    .eq('id', invoiceId)
    .maybeSingle();

  return details || {};
};
