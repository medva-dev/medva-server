const _ = require('lodash');
const fs = require('fs');
const db = require('../_init');
const ex = fs.readFileSync('./experiences.txt', 'utf-8').split('\n');

async function x() {
  const all = await db('virtualAssistants').select('id');

  await db.transaction(async (trx) => {
    for await (const x of all) {
      const { id } = x;
      const experiences = _.sampleSize(ex, 5).map((z) => ({
        virtualAssistantId: id,
        experience: z,
      }));
      await trx('experiences').insert(experiences);
      console.log(`Successfully added ${experiences.length} to ${id}`);
    }
  });
  process.exit();
}

x();
