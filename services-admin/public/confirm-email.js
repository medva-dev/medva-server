const joi = require('joi');

const schema = joi
  .object({
    id: joi.string().uuid().required(),
    token: joi.string().uuid().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (transaction, form) => {
  const { id, token } = await schema.validateAsync(form);
  const check = await transaction('auth.users').where('id', id).first();

  if (!check) {
    throw new Error('Cannot find user. Please try to register again');
  }

  const { raw_user_meta_data } = check;

  if (raw_user_meta_data?.token !== token) {
    throw new Error('Invalid token. Please try to register again');
  }

  if (check.email_confirmed_at) {
    return {
      email: check.email,
      successMessage:
        'Email is already confirmed. Redirecting you to login page',
    };
  }

  await transaction('auth.users').where('id', check.id).update({
    email_confirmed_at: transaction.fn.now(),
  });

  return {
    email: check.email,
    successMessage:
      'Your email has been confirmed. Redirecting you to login page',
  };
};
