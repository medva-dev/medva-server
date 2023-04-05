const axios = require('axios');

const create = async () => {
  const token =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6Inc2Z3lDdWtLUzdPcWkwNk1qa0ZrbHciLCJleHAiOjE2NzYxMzE0MTYsImlhdCI6MTY3NjEyNjAxOX0.XDiNtLeN7hxmOd86XTwfjAXGVrDa-OxZ566CfPutSuA';
  const request = {
    headers: {
      Authorization: 'Bearer ' + token,
      'User-Agent': 'Zoom-api-Jwt-Request',
      'content-type': 'application/json',
    },
    method: 'POST',
    url: 'https://api.zoom.us/v2/meetings/87879969862/registrants',
    data: {
      first_name: 'Elaine',
      last_name: 'Lopez',
      email: 'love.elenalopez@gmail.com',
      auto_approve: true,
    },
  };

  const response = await axios.request(request);
  console.log(response);
};

create();
