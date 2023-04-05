const axios = require('axios');
const db = require('../_init');

axios.get('https://randomuser.me/api/?results=1000').then(async (response) => {
  const { data } = response;
  const { results } = data;
  const array = [];

  await db.transaction(async (trx) => {
    const all = await trx('virtualAssistants');

    results?.forEach(({ email, name, picture }) => {
      const { first, last } = name;
      const { large } = picture;
      array.push({ firstName: first, lastName: last, avatar: large, email });
    });

    let index = 0;
    for await (const va of all) {
      const newData = array[index++];
      console.log(`Updating ${va.id} to ${newData.email}`);
      const { email, firstName, lastName, avatar } = newData;
      await trx('virtualAssistants')
        .update({ email, firstName, lastName, avatar })
        .where('id', va.id);
    }
  });
  console.log('done');
  process.exit();
});
