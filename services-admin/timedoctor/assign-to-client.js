const joi = require('joi');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    projectId: joi.string().required(),
    clientId: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form, user) => {
  const { projectId, clientId } = await schema.validateAsync(form);

  const { error } = await supabase
    .from('tdProjects')
    .update({ clientId })
    .eq('id', projectId);

  if (error) {
    throw new Error(error.message);
  }

  return {
    successMessage: 'The project has been successfully assigned to the client',
  };
};
