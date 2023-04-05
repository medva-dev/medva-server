const urls = `https://medva.s3.ap-southeast-1.amazonaws.com/1.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/2.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/3.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/4.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/5.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/6.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/7.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/8.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/9.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/10.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/11.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/12.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/13.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/14.mp4
  https://medva.s3.ap-southeast-1.amazonaws.com/15.mp4`.split('\n');

const _ = require('lodash');
const fs = require('fs');
const db = require('../_init');

(async () => {
  await db.transaction(async (trx) => {
    const va = await trx('virtualAssistants').select('id');
    for await (const { id } of va) {
      const video = _.sample(urls);
      await trx('virtualAssistants').update({ video }).where('id', id);
      console.log(`Successfully updated video of ${id}`);
    }
  });
  process.exit();
})();
