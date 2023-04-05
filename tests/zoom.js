const axios = require('axios');

const create = async () => {
  const token =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6Inc2Z3lDdWtLUzdPcWkwNk1qa0ZrbHciLCJleHAiOjE2NzY3NjY0MDIsImlhdCI6MTY3NjE2MTYwMn0.GpgeW-GFTKhPehEoGVvg8ZeTcmOC5Qttl9tKFySggdU';
  const request = {
    headers: {
      Authorization: 'Bearer ' + token,
      'User-Agent': 'Zoom-api-Jwt-Request',
      'content-type': 'application/json',
    },
    method: 'POST',
    url: 'https://api.zoom.us/v2/users/me/meetings',
    data: {
      topic: 'Appointment: Dr. Nigel Lopezxx',
      calendar_type: 2,
      start_time: '2023-02-14T11:00:00+01:00',
      duration: 30,
      // schedule_for: 'loveelenalopez@gmail.com',
      timezone: 'Europe/Zurich',
      agenda: 'This is the hidden agenda',
      settings: {
        // authentication_exception: [
        //   {
        //     email: 'love.elenalopez@gmail.com',
        //     name: 'Elaine Lopez',
        //   },
        // ],
        // // meeting_authentication: true,
        meeting_invitees: [
          { email: 'love.elenalopez@gmail.com' },
          { email: 'uselessnegativity@gmail.com' },
        ],
        // breakout_room: {
        //   enable: true,
        //   rooms: [
        //     {
        //       name: 'room1',
        //       participants: ['love.elenalopez@gmail.com'],
        //     },
        //   ],
        // },
        // email_notification: true,
        // host_video: true,
        // participant_video: true,
        // cn_meeting: false,
        // in_meeting: true,
        // join_before_host: false,
        // mute_upon_entry: false,
        // watermark: false,
        // use_pmi: false,
        // approval_type: 2,
        // audio: 'both',
        // enforce_login: false,
        registrants_email_notification: true,
        registrants_confirmation_email: true,
        // waiting_room: true,
        // allow_multiple_devices: true,
      },
    },
  };

  const response = await axios.request(request);
  console.log(response);
};

create();
// console.log( moment().add(5, 'minutes').format());
