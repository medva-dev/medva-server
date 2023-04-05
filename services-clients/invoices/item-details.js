const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    id: joi.number().positive().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form, user) => {
  const { id } = await schema.validateAsync(form);

  const clientId = user.uid;

  const { data, error } = await supabase
    .from('invoiceItemDetails')
    .select(
      'timesheets(date, approvedHours, tdUsers(name), tdProjects(name, clients(id)))'
    )
    .eq('invoiceItemId', id);

  if (!data || data.length < 1) {
    throw new Error('Cannot find item details');
  }

  if (data[0]?.timesheets?.tdProjects?.clients?.id !== clientId) {
    throw new Error('This invoice does not belong to you');
  }

  if (error) {
    throw error;
  }

  return data;
};
