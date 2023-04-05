const joi = require('joi');
const { supabase } = require('../../helpers/supabase');
const { instance: axios, getToken } = require('../../helpers/timedoctor');

const schema = joi
  .object({
    name: joi.string().required(),
    projectId: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form) => {
  const { projectId, name } = await schema.validateAsync(form);

  const { token } = await getToken();

  const request = {
    url: 'tasks',
    method: 'post',
    data: { name, project: { id: projectId } },
    params: { token },
  };

  const response = {
    data: {},
    errorMessage: '',
  };

  try {
    const res = await axios.request(request);
    if (res?.data?.id) {
      response.data = res.data;
    }
  } catch (e) {
    response.errorMessage = e?.message || JSON.stringify(e);
  }

  if (response.errorMessage) {
    throw new Error(response.errorMessage);
  }

  if (response?.data) {
    // insert the new task to supabase db
    const task = response.data;

    const insert = {
      id: task.id,
      name: task.name,
      deleted: task.deleted,
      status: task.status,
      tdProjectId: task.project.id,
    };

    const { error } = await supabase.from('tdTasks').insert(insert);

    if (error) {
      throw new Error(
        `The task has been added to TimeDoctor but there was an error while saving to the database: ${error.message}`
      );
    }
  }

  return { successMessage: 'Successfully created new task' };
};
