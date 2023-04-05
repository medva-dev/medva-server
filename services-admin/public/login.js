const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    email: joi.string().email().required(),
    password: joi.string().min(6).max(20).required(),
    timezone: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form) => {
  const { email, password, timezone } = await schema.validateAsync(form);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  const user = await db('users').where('uid', data.user.id).first();

  if (!user) {
    throw new Error('You are not allowed to use this portal');
  }

  return data;
};
