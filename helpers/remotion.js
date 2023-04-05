const {
  REMOTION_AWS_REGION,
  REMOTION_LAMBDA_FUNCTION,
  REMOTION_S3_URL,
  REMOTION_COMPOSITION,
} = process.env;

const {
  renderMediaOnLambda,
  getRenderProgress,
} = require('@remotion/lambda/client');
const { supabase } = require('./supabase');

const FPS = 60;

exports.renderVideo = async ({ videoUrl, name, duration, id }) => {
  const functionName = REMOTION_LAMBDA_FUNCTION;
  const region = REMOTION_AWS_REGION;

  console.log('Starting to render', videoUrl, name, duration);

  const { renderId, bucketName } = await renderMediaOnLambda({
    region,
    functionName,
    serveUrl: REMOTION_S3_URL,
    composition: REMOTION_COMPOSITION,
    inputProps: { fps: FPS, videoUrl, duration: duration + 4, name },
    codec: 'h264',
    maxRetries: 1,
    framesPerLambda: FPS,
    privacy: 'public',
  });

  let outputFile;

  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName,
      region,
    });

    // console.log(progress.overallProgress * 100, '%');

    await supabase
      .from('videoUploads')
      .update({
        status: progress,
      })
      .eq('id', id);

    if (progress.done) {
      outputFile = progress.outputFile;
      console.log('Render finished!', progress.outputFile);
      break;
    }

    if (progress.fatalErrorEncountered) {
      console.error('Error enountered', progress.errors);
      await supabase
        .from('videoUploads')
        .update({
          error: JSON.stringify(progress.errors),
        })
        .eq('id', id);
      break;
    }
  }

  if (outputFile) {
    const finalUpdate = await supabase
      .from('videoUploads')
      .update({
        renderedVideoLocation: outputFile,
      })
      .eq('id', id);
    console.log(finalUpdate);
  }

  console.log('Finished rendering');
};
