const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    id: joi.number().positive().required(),
    status: joi.string().required().valid('open', 'booked', 'hired', 'hidden'),
  })
  .options({
    stripUnknown: true,
  });

module.exports = async (db, form, user) => {
  const { id, status } = await schema.validateAsync(form);

  const check = await supabase
    .from('virtualAssistants')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (check.error) {
    throw check.error;
  }

  if (!check.data) {
    throw new Error('Cannot find virtual assistant');
  }

  const update = await supabase
    .from('virtualAssistants')
    .update({
      status,
    })
    .eq('id', id);

  if (update.error) {
    throw update.error;
  }

  return { successMessage: 'Status update successful' };
};
