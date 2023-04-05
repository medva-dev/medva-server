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
  const { hash, timezone } = await schema.validateAsync(form);
  if (!hash.startsWith('#')) {
    throw new Error('Invalid hash');
  }

  const token = parse(hash.substring(1));

  if (!token.access_token) {
    throw new Error('Invalid session');
  }

  const session = validateJWT(token.access_token);

  // check if user is already a client
  const client = await db('clients').where('id', session.uid).first();

  if (!client) {
    // need to insert client
    const insert = {
      id: session.sub,
      email: session.email,
      name: session.user_metadata?.name ?? 'Client Name',
      avatarUrl: session.user_metadata?.avatar_url,
      timezone,
    };
    await db('clients').insert(insert);
  }

  const { data, error } = await supabase.auth.admin.getUserById(session.sub);

  if (error) {
    throw error;
  }

  return { session: { ...token, user: data.user } };
};
