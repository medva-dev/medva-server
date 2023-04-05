const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    id: joi.string().required(),
    value: joi.boolean().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form, user) => {
  const { id, value } = await schema.validateAsync(form);

  const { data, error } = await supabase
    .from('zoomUsers')
    .select('id', 'firstName')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(error);
  }

  if (!data?.id) {
    throw new Error('Cannot find zoom user');
  }

  await supabase
    .from('zoomUsers')
    .update({
      assignedMeetingsCounter: 1,
    })
    .gt('assignedMeetingsCounter', 1);

  await supabase
    .from('zoomUsers')
    .update({
      canAcceptBookings: value,
      assignedMeetingsCounter: 0,
    })
    .eq('id', data.id);

  return {
    successMessage: `Successfully updated ${data.firstName} booking status`,
  };
};
