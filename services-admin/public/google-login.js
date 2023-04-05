const { supabase } = require('../../helpers/supabase');

module.exports = async () => {
  const redirectTo = new URL(
    '/google-after-login',
    process.env.ADMIN_CLIENT_APP_URL
  ).href;

  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  return data;
};
