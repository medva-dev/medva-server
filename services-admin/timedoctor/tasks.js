const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    projectId: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form) => {
  const { projectId } = await schema.validateAsync(form);

  const { data, error } = await supabase
    .from('tdTasks')
    .select()
    .eq('tdProjectId', projectId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
