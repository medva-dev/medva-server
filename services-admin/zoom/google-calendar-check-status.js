const { getValidTokenFromServer } = require('../../helpers/google');
const { supabase } = require('../../helpers/supabase');

module.exports = async (db, form, user) => {
  const { data } = await supabase
    .from('users')
    .select('uid, googleRefreshToken')
    .eq('uid', user.uid)
    .maybeSingle();

  if (!data?.googleRefreshToken) {
    return { synced: false };
  }

  try {
    // check if refresh token is valid
    await getValidTokenFromServer(data.googleRefreshToken);
    return { synced: true };
  } catch (e) {
    console.error(e);

    // means there is an old token that is not valid
    // reset to null
    await supabase
      .from('users')
      .update({
        googleRefreshToken: null,
      })
      .eq('uid', user.uid);
  }

  return { synced: false };
};
