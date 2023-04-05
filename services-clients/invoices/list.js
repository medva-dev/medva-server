const { supabase } = require('../../helpers/supabase');

module.exports = async (db, form, user) => {
  const clientId = user.uid;

  const { data, error } = await supabase
    .from('invoices')
    .select(`*, tdProjects!inner(name,clients!inner(id))`)
    .eq('tdProjects.clients.id', clientId);

  if (error) {
    throw error;
  }

  return data;
};
