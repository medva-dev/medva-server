const joi = require('joi');
const { supabase } = require('../../helpers/supabase');
const { v4 } = require('uuid');
const { emailConfirmation } = require('../../helpers/mail');

const schema = joi
  .object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required().min(6).max(20),
    timezone: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (transaction, form, user) => {
  const { name, email, password, timezone } = await schema.validateAsync(form);

  const check = await transaction('clients').where('email', email).first();

  if (check) {
    throw new Error('Your email address is already registered');
  }

  const token = v4();

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { name },
  });

  if (error && error.message?.indexOf('has already been registered') < 0) {
    throw error;
  }

  let insert;

  const client = await transaction('auth.users').where('email', email).first();

  if (!client) {
    throw new Error('There was an unexpected error. Please try again');
  }

  const raw =
    typeof client.raw_user_meta_data === 'object'
      ? client.raw_user_meta_data
      : {};

  // need to update token to have an email confirmation link
  client.raw_user_meta_data = { ...raw, token };

  await transaction('auth.users')
    .update({ raw_user_meta_data: client.raw_user_meta_data })
    .where('id', client.id);

  console.log(`Successfully updated ${client.email}'s token`);

  insert = {
    id: client.id,
    email: client.email,
    name: client.raw_user_meta_data?.name ?? 'Client Name',
    timezone,
  };

  await transaction('clients').insert(insert);
  await emailConfirmation(client);

  return {
    successMessage:
      'We sent you an email, please click on the link to confirm your registration.',
  };
};
