const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    invoiceId: joi.number().positive().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form, user) => {
  const { invoiceId } = await schema.validateAsync(form);

  const clientId = user.uid;

  const { data, error } = await supabase
    .from('invoices')
    .select(
      '*, tdProjects(name, clients(id, name)), invoiceItems(*, tdUsers(name) ) '
    )
    .eq('id', invoiceId)
    .maybeSingle();

  if (!data) {
    throw new Error('Cannot find invoice');
  }

  if (data?.tdProjects?.clients?.id !== clientId) {
    throw new Error('This invoice does not belong to you');
  }

  if (error) {
    throw error;
  }

  return data;
};
