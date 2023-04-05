const { supabase } = require('../../helpers/supabase');
const joi = require('joi');
const { parse } = require('querystring');
const { validateJWT } = require('../../helpers/auth');

const schema = joi
  .object({
    hash: joi.string().required(),
    timezone: joi.string().required(),
  })
  .options({
    stripUnknown: true,
  });

module.exports = async (db, form) => {
  const { hash } = await schema.validateAsync(form);

  if (!hash.startsWith('#')) {
    throw new Error('Invalid hash');
  }

  const token = parse(hash.substring(1));

  if (!token.access_token) {
    throw new Error('Invalid session');
  }

  const session = validateJWT(token.access_token);

  // check if user is already a client
  const user = await supabase
    .from('users')
    .select('uid')
    .eq('uid', session.uid)
    .maybeSingle();

  const zoomUser = await supabase
    .from('zoomUsers')
    .select('id, email, userId')
    .eq('email', session.email)
    .maybeSingle();

  if (!user.data?.uid && !zoomUser.data?.id) {
    throw new Error('You are not allowed to use this portal');
  }

  if (!user.data?.uid) {
    // insert this user first into the users table
    const newUser = {
      uid: session.sub,
      name: session.user_metadata?.name ?? 'No name found',
      email: session.email,
      avatarUrl: session.user_metadata?.avatar_url,
      isSuperuser: false,
    };

    const insertUser = await supabase.from('users').insert(newUser);

    if (insertUser.error) {
      throw insertUser.error;
    }
    console.log('Successfully inserted new user', newUser.email);
  }

  if (zoomUser.data?.id && !zoomUser.data?.userId) {
    // update userId of the zoomUser
    const zoomUserUpdate = await supabase
      .from('zoomUsers')
      .update({
        userId: session.sub,
      })
      .eq('id', zoomUser.data.id);

    if (zoomUserUpdate.error) {
      throw zoomUserUpdate.error;
    }
  }

  const { data, error } = await supabase.auth.admin.getUserById(session.sub);

  if (error) {
    throw error;
  }

  return { session: { ...token, user: data.user } };
};
