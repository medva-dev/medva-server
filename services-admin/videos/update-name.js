const joi = require('joi');
const { renderVideo } = require('../../helpers/remotion');
const { supabase } = require('../../helpers/supabase');

const schema = joi
  .object({
    id: joi.number().required(),
    name: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, data, user) => {
  const { id, name } = await schema.validateAsync(data);

  const { data: video } = await supabase
    .from('videoUploads')
    .select()
    .eq('id', id)
    .maybeSingle();

  if (!video) {
    throw new Error('Cannot find video');
  }

  const { error } = await supabase
    .from('videoUploads')
    .update({ virtualAssistantName: name })
    .eq('id', id);

  if (error) {
    throw error;
  }

  // this will run in background
  renderVideo({
    name,
    videoUrl: video.rawVideoLocation,
    duration: video.duration,
    id,
  });

  return {
    successMessage:
      'Successfully updated virtual assistant name. Rendering of the video has been started',
  };
};
