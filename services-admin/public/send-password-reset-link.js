const joi = require('joi');
const { supabase } = require('../../helpers/supabase');
const { v4 } = require('uuid');
const { sendPasswordResetLink } = require('../../helpers/mail');

const schema = joi
  .object({
    email: joi.string().email().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form) => {
  const { email } = await schema.validateAsync(form);

  const check = await db('clients').where('email', email).first();

  if (!check) {
    throw new Error(
      'We cannot find an account associated with the email address provided'
    );
  }

  await sendPasswordResetLink(check.id);

  return {
    successMessage:
      'A link to reset your password has been sent to your email address',
  };
};
