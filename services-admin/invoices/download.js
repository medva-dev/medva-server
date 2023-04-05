const md5 = require('md5');
const pdf = require('../../helpers/pdf');

module.exports = async (db, req, res) => {
  const { id, hash } = req.query ?? {};

  if (md5(String(id)) !== hash) {
    throw new Error('Invalid invoice');
  }

  await pdf(id, res);
};
