const { supabase } = require('../../helpers/supabase');

module.exports = async (db, form, user) => {
  const userId = user.uid;

  const { data, error } = await supabase
    .from('bookings')
    .select(
      `*, virtualAssistants(firstName, lastName, avatar, category, subCategory)`
    )
    .eq('clientId', userId);

  if (error) {
    throw error;
  }

  return data;
};
