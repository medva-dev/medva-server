const db = require('../_init');

(async () => {
  await db.transaction(async (trx) => {
    const va = await trx('virtualAssistants').select('id', 'firstName');
    for await (const { id, firstName } of va) {
      const m = firstName.replace(/\s/g, '');
      await trx('virtualAssistants')
        .update({ email: `nigelstefanlopez+${m}@gmail.com` })
        .where('id', id);
      console.log(`Successfully updated nigelstefanlopez+${m}@gmail.com`);
    }
  });
  process.exit();
})();
