const events = require('./events');

exports.handler = async (event) => {
  let body = {};

  try {
    body = JSON.parse(event.body) || {};
  } catch (e) {
    body = {};
  }

  let responseBody = {};

  if (body?.payload?.plainToken) {
    // for zoom webhook verification
    try {
      responseBody = await events.verifyZoomWebhook(body.payload);
    } catch (e) {
      responseBody = { message: e.message };
      console.log(e.message);
    }
  } else if (body?.event && body?.payload) {
    try {
      responseBody = await events.handleZoomEvent(body);
    } catch (e) {
      responseBody = { message: e.message };
      console.log(e.message);
    }
  }

  const response = {
    statusCode: 200,
    body: responseBody,
  };

  return response;
};
