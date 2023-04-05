const joi = require('joi');
const { getAuthUrl, getGoogleToken } = require('../../helpers/google');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    code: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form, user) => {
  const { code } = await schema.validateAsync(form);

  const tokens = await getGoogleToken(code);

  if (!tokens.refresh_token) {
    throw new Error('No tokens returned, please try again');
  }

  const { error } = await supabase
    .from('users')
    .update({
      googleRefreshToken: tokens.refresh_token,
    })
    .eq('uid', user.uid);

  if (error) {
    throw error;
  }

  return { successMessage: 'Successfully synced Google calendar' };
};
