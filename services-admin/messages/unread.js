const { supabase } = require('../../helpers/supabase');

module.exports = async () => {
  const { data } = await supabase.from('viewMessages').select('unreadCount');
  return data;
};
