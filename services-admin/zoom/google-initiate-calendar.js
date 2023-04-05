const { getAuthUrl } = require('../../helpers/google');

module.exports = async (db, form, user) => {
  const url = getAuthUrl();
  console.log(url);
  return { url };
};
