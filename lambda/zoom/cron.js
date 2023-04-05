const events = require('./events');

exports.handler = async () => {
  let responseBody = {};

  try {
    await events.getAndSaveUsers();
    await events.getAndSaveMeetings();
  } catch (e) {
    responseBody = { message: e.message };
    console.log(e.message);
  }

  try {
    await events.updateLastCron();
  } catch (e) {
    console.error(e);
  }

  const response = {
    statusCode: 200,
    body: responseBody,
  };

  return response;
};
