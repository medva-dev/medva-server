const { supabase } = require('../../helpers/supabase');

module.exports = async () => {
  const { data, error } = await supabase
    .from('system')
    .select()
    .eq('name', 'lastDateOfInvoiceGeneration')
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error(
      'No last invoice generated date. Please contact administrator'
    );
  }

  return data;
};
