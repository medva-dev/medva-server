const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    email: joi.string().email().required(),
    password: joi.string().min(6).max(20).required(),
    timezone: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (transaction, form, user) => {
  const { email, password, timezone } = await schema.validateAsync(form);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log(data);

  if (error) {
    throw error;
  }

  const client = await transaction('clients').where('id', data.user.id).first();

  if (!client) {
    // need to insert as a new client
    const insert = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name ?? 'Client Name',
      timezone,
    };

    await transaction('clients').insert(insert);
  }

  return data;
};
