const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    id: joi.string().uuid().required(),
    token: joi.string().uuid().required(),
    password: joi.string().min(6).max(20).required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form, user) => {
  const { id, token, password } = await schema.validateAsync(form);
  const check = await db('auth.users').where('id', id).first();

  if (!check) {
    throw new Error('Cannot find user');
  }

  const { raw_user_meta_data } = check;

  if (raw_user_meta_data?.resetPasswordToken !== token) {
    throw new Error('Invalid token');
  }

  const { error } = await supabase.auth.admin.updateUserById(check.id, {
    password,
  });

  delete raw_user_meta_data.resetPasswordToken;

  await db('auth.users').update({ raw_user_meta_data }).where('id', check.id);

  if (error) {
    throw new Error(error);
  }

  return {
    email: check.email,
    successMessage:
      'Your password has been successfully reset. Redirecting you to login page',
  };
};
