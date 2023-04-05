const supabase = require('./helpers/supabase');
const timedoctor = require('./helpers/timedoctor');

const axios = timedoctor.instance;

exports.handler = async (event) => {
  let clientData = {};

  try {
    clientData = JSON.parse(event.body) || {};
  } catch (e) {
    clientData = {};
  }

  const response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    },
    body: {},
  };

  try {
    const { method, url, params, data } = clientData ?? {};

    if (!method) {
      throw new Error(`method not found`);
    }

    if (!url) {
      throw new Error(`url not found`);
    }

    const { token } = await timedoctor.getToken();

    const request = {
      method,
      url,
      params,
      data,
    };

    response.body.request = request;

    const finalRequest = {
      ...request,
      params: { token, ...params },
    };

    const tdResponse = await axios.request(finalRequest);

    Object.assign(response.body, { response: tdResponse });
  } catch (e) {
    response.body.message = e.message;
  }

  response.body = JSON.stringify(response.body);

  return response;
};
