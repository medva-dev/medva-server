const axios = require('axios');

const {
  ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_SECRET_TOKEN,
} = process.env;

exports.getToken = async () => {
  const request = {
    url: `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    method: 'POST',
    auth: {
      username: ZOOM_CLIENT_ID,
      password: ZOOM_CLIENT_SECRET,
    },
  };

  const { data = {} } = await axios.request(request);
  return data.access_token;
};
