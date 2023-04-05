const axios = require('axios');
const crypto = require('crypto');
const moment = require('moment');
const supabase = require('../helpers/supabase');

let currentToken;

const {
  ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_SECRET_TOKEN,
} = process.env;

const functions = {};

functions.getAllowance = async () => {
  let allowance = await supabase('system')
    .where('name', 'meetingAllowance')
    .first();

  if (allowance?.value?.minutes) {
    allowance = Number(allowance.value.minutes || 15);
  } else {
    allowance = 15;
  }

  return allowance;
};

functions['meeting.created'] = async (payload = {}) => {
  const { object = {} } = payload ?? {};

  if (!object?.start_time) {
    // there are meetings that have no start time
    return;
  }

  const allowance = await functions.getAllowance();
  const end = moment(object.start_time)
    .add(object.duration, 'minutes')
    .add(allowance, 'minutes');

  const meeting = {
    id: object.id,
    uuid: object.uuid,
    operatorId: object.host_id,
    topic: object.topic,
    startTime: object.start_time,
    endTime: end.format(),
    duration: object.duration,
    allowance,
    timezone: object.timezone,
    joinUrl: object.join_url,
    password: object.password,
  };

  await functions.checkOrCreateUser(meeting.operatorId);

  console.log(`meeting.created - ${meeting.id}`);
  await supabase('zoomMeetings').insert(meeting).onConflict('id').merge();
  console.log(
    `meeting.created - successfully inserted to zoomMeetings - ${meeting.id}`
  );
};

functions['meeting.updated'] = async (payload = {}) => {
  const { object = {}, operator_id } = payload ?? {};
  const { id } = object;

  // need to fetch the meeting and save it
  const meetingObject = await functions.zoomGetMeeting(id);
  // then pass to meeting.created so it will be saved/merged to the database
  await functions['meeting.created']({ object: meetingObject });
};

functions['meeting.deleted'] = async (payload = {}) => {
  const { object = {} } = payload ?? {};
  const { id } = object;

  await supabase('zoomMeetings').update({ status: 'deleted' }).where('id', id);

  console.log(`Meeting ID ${id} has been deleted`);
};

functions['meeting.started'] = async (payload = {}) => {};

functions['meeting.ended'] = async (payload = {}) => {};

functions.validateToken = async () => {
  const request = {
    url: `https://api.zoom.us/v2/users/me`,
    method: 'GET',
    headers: { Authorization: 'Bearer ' + currentToken },
  };
  try {
    await axios.request(request);
    return true;
  } catch (e) {}

  currentToken = undefined;
  return false;
};

functions.getToken = async () => {
  const request = {
    url: `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    method: 'POST',
    auth: {
      username: ZOOM_CLIENT_ID,
      password: ZOOM_CLIENT_SECRET,
    },
  };

  if (!currentToken) {
    console.log(`Fetching new token`);
    const { data = {} } = await axios.request(request);
    currentToken = data.access_token;
  }

  // validate token here
  const valid = await functions.validateToken();

  if (!valid) {
    console.log('Token is invalid');
    currentToken = undefined;
    return functions.getToken();
  }

  return currentToken;
};

functions.getHeaders = async () => {
  const token = await functions.getToken();
  return { Authorization: 'Bearer ' + token };
};

functions.zoomGetMeeting = async (id) => {
  const request = {
    url: `https://api.zoom.us/v2/meetings/${id}`,
    method: 'GET',
    headers: await functions.getHeaders(),
  };

  console.log(`Fetching meeting id ${id}`);
  const { data = {} } = await axios.request(request);

  return data;
};

functions.zoomGetUser = async (id) => {
  const request = {
    url: `https://api.zoom.us/v2/users/${id}`,
    method: 'GET',
    headers: await functions.getHeaders(),
  };

  console.log(`Fetching user ${id}`);
  const { data = {} } = await axios.request(request);

  const user = {
    id: data.id,
    accountId: data.account_id,
    firstName: data.first_name,
    lastName: data.last_name,
    displayName: data.display_name,
    email: data.email,
    department: data.dept,
    roleName: data.role_name,
    timezone: data.timezone,
    zoomCreatedAt: data.user_created_at,
  };

  return user;
};

functions.checkOrCreateUser = async (id) => {
  let user = await supabase('zoomUsers').where('id', id).first();

  if (!user) {
    // need to get user information here
    console.log('User not found, creating user');
    user = await functions.zoomGetUser(id);
    console.log(`Inserting ${user.id} to zoomUsers`);
    await supabase('zoomUsers').insert(user).onConflict('id').merge();
    console.log(`Successfully inserted ${user.id} to zoomUsers`);
  }

  return user;
};

functions.verifyZoomWebhook = async (payload = {}) => {
  const hmac = crypto.createHmac('sha256', ZOOM_SECRET_TOKEN);
  const response = {
    plainToken: payload.plainToken,
    encryptedToken: hmac.update(payload.plainToken).digest('hex'),
  };
  return response;
};

functions.handleZoomEvent = async (body = {}) => {
  const { event, payload = {} } = body ?? {};
  if (typeof functions[event] !== 'function') {
    return;
  }

  const { object = {} } = payload;
  const { host_id } = object;

  if (!host_id && event !== 'meeting.updated') {
    console.log('No host id found');
    console.log(payload);
    console.log('------------');
    return;
  }

  if (host_id) {
    // host_id is the zoomUsers.id
    // check zoomUsers if it is already saved
    await functions.checkOrCreateUser(host_id);
  }

  await functions[event](payload);
};

functions.zoomGetUsers = async (pageNumber = 1) => {
  const request = {
    url: `https://api.zoom.us/v2/users`,
    method: 'GET',
    headers: await functions.getHeaders(),
    params: {
      page_number: pageNumber,
      page_size: 100,
    },
  };

  console.log(`Fetching users `, { pageNumber });

  const { data = {} } = await axios.request(request);
  const { users = [] } = data;

  if (data?.page_count > data?.page_number) {
    users.push(...(await functions.zoomGetUsers(data.page_number + 1)));
  }

  return users;
};

functions.getAndSaveUsers = async () => {
  const users = await functions.zoomGetUsers();
  const array = [];
  users.forEach((user) => {
    array.push({
      id: user.id,
      accountId: user.account_id,
      firstName: user.first_name,
      lastName: user.last_name,
      displayName: user.display_name,
      email: user.email,
      department: user.dept,
      roleName: user.role_name,
      timezone: user.timezone,
      zoomCreatedAt: user.user_created_at,
    });
  });

  if (array.length > 0) {
    await supabase('zoomUsers').insert(array).onConflict('id').merge();
    console.log(`Successfully saved ${array.length} users`);
  }
};

functions.zoomGetMeetings = async (id, pageNumber = 1) => {
  const request = {
    url: `https://api.zoom.us/v2/users/${id}/meetings`,
    method: 'GET',
    headers: await functions.getHeaders(),
    params: {
      page_number: pageNumber,
      page_size: 100,
    },
  };

  console.log(`Fetching meetings of ${id} `, { pageNumber });

  const { data = {} } = await axios.request(request);
  const { meetings = [] } = data;

  if (data?.page_count > data?.page_number) {
    meetings.push(
      ...(await functions.zoomGetMeetings(id, data.page_number + 1))
    );
  }

  return meetings;
};

functions.getAndSaveMeetings = async () => {
  const users = await supabase('zoomUsers').select('id');
  const allowance = await functions.getAllowance();

  for await (const user of users) {
    try {
      const meetings = await functions.zoomGetMeetings(user.id);
      const insert = [];

      meetings.forEach((object) => {
        if (object.start_time) {
          const end = moment(object.start_time)
            .add(object.duration, 'minutes')
            .add(allowance, 'minutes');

          const meeting = {
            id: object.id,
            uuid: object.uuid,
            operatorId: object.host_id,
            topic: object.topic,
            startTime: object.start_time,
            endTime: end.format(),
            duration: object.duration,
            allowance,
            timezone: object.timezone,
            joinUrl: object.join_url,
            password: object.password,
          };
          insert.push(meeting);
        }
      });

      if (insert.length > 0) {
        await supabase('zoomMeetings').insert(insert).onConflict('id').merge();
        console.log(`Successfully inserted ${insert.length} meetings`);
      }
    } catch (e) {
      console.error(e);
      console.log(user.id, e.message);
    }
  }
};

functions.updateLastCron = async () => {
  const insert = {
    name: 'cronZoom',
    value: {
      lastRun: moment().format(),
    },
  };
  console.log('Updaying last run of cron', insert);
  await supabase('system').insert(insert).onConflict('name').merge();
};

module.exports = functions;
