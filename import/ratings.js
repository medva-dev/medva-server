const db = require('../_init');
const _ = require('lodash');
const arr = [3.5, 4, 4.5, 5];

(async () => {
  await db.transaction(async (trx) => {
    const va = await trx('virtualAssistants').select('id');
    for await (const { id } of va) {
      const rating = _.sample(arr);
      await trx('virtualAssistants').update({ rating }).where('id', id);
      console.log(`Successfully updated ${id} to rating of ${rating}`);
    }
  });
  process.exit();
})();
