const { google } = require('googleapis');
const { OAuth2 } = google.auth;
const axios = require('axios');
const { v4 } = require('uuid');
const moment = require('moment-timezone');
const { supabase } = require('./supabase');
const db = require('../_init');
const { getValidTokenFromServer } = require('./google');
const zoomTimezones = require('./zoomTimezones.json');
const { sendMeetingInvitations } = require('./mail');
const { getToken } = require('./zoom');

const MEETING_DURATION = 30;
const WORKING_DAYS = { from: 2, to: 6 };
const DISABLED_WORKING_DAYS = { 0: true, 1: true };
const WORKING_HOURS = { from: 0, to: 8 };
const MAX_DISPLAY_WEEKS = 2;

exports.getAllowance = async () => {
  let allowance = await supabase
    .from('system')
    .select('name, value')
    .eq('name', 'meetingAllowance')
    .maybeSingle();

  if (allowance?.data?.value?.minutes) {
    allowance = Number(allowance.data.value.minutes || 15);
  } else {
    allowance = 15;
  }

  return allowance;
};

exports.getAvailableDates = async (timezone) => {
  const today = moment().hour(0).minute(0).second(0);

  const { data: meetings, error } = await supabase
    .from('zoomMeetings')
    .select('topic, startTime, endTime, zoomUsers!inner(id)')
    .eq('zoomUsers.canAcceptBookings', true)
    .gt('startTime', today.format())
    .is('status', null);

  const zoomUsers = await supabase
    .from('zoomUsers')
    .select('id')
    .eq('canAcceptBookings', true);

  const users = {};

  const allBlocks = {};

  zoomUsers.data?.forEach((user) => {
    users[user.id] = {};
  });

  meetings.forEach((meeting) => {
    const userId = meeting.zoomUsers.id;

    if (!users[userId]) {
      users[userId] = {};
    }

    const start = moment(meeting.startTime);
    const end = moment(meeting.endTime);

    if (start.minute() >= 0 && start.minute() < 30) {
      start.minute(0); // round down to 0
    } else if (start.minute() >= 30 && start.minute() < 60) {
      start.minute(30); // round down to 0
    }

    if (end.minute() >= 0 && end.minute() < 30) {
      end.minute(0); // round down to 0
    } else if (end.minute() >= 30 && end.minute() < 60) {
      end.minute(30); // round down to 0
    }

    while (end >= start) {
      const block = start.format();
      users[userId][block] = true;

      if (!allBlocks[block]) {
        allBlocks[block] = {};
      }

      allBlocks[block][userId] = true;
      start.add(30, 'minutes');
    }
  });

  const unavailableBlocks = {};

  Object.keys(allBlocks).forEach((key) => {
    if (Object.keys(allBlocks[key]).length === Object.keys(users).length) {
      // means all users are not available on this block
      unavailableBlocks[key] = true;
    }
  });

  const blocks = [];
  console.log(allBlocks);
  const currentWeekNumber = today.week();
  const maxWeek = currentWeekNumber + MAX_DISPLAY_WEEKS;

  while (today.week() <= maxWeek) {
    today.add(1, 'day');
    if (!DISABLED_WORKING_DAYS[today.day()]) {
      for (let time = WORKING_HOURS.from; time < WORKING_HOURS.to; time++) {
        today.hour(time).minute(0).second(0);
        const block1 = today.format();
        if (!unavailableBlocks[block1]) {
          blocks.push(block1);
        }

        today.minute(30);
        const block2 = today.format();
        if (!unavailableBlocks[block2]) {
          blocks.push(block2);
        }
      }
    }
  }

  const validTimezone = !!(timezone ? moment.tz.zone(timezone) : null);

  const availableDates = {};

  blocks.forEach((block) => {
    let date;

    if (validTimezone) {
      date = moment.tz(block, timezone);
    } else {
      date = moment(block);
    }

    const d = date.format('YYYY-MM-DD');
    if (!availableDates[d]) {
      availableDates[d] = [];
    }

    availableDates[d].push(date.format('hh:mm a'));
  });

  console.log(availableDates);

  return { availableDates, timezone, allBlocks };
};

exports.createMeeting = async (
  client,
  va,
  date,
  timezone,
  unavailableUsers = []
) => {
  await db.transaction(async (transaction) => {
    let zoomUsersThatCanAcceptBookings = transaction('zoomUsers')
      .select('id', 'displayName', 'userId', 'assignedMeetingsCounter')
      .where('canAcceptBookings', true)
      .orderByRaw('"assignedMeetingsCounter" asc, "displayName" asc')
      .first();

    if (unavailableUsers?.length > 0) {
      zoomUsersThatCanAcceptBookings.whereNotIn('id', unavailableUsers);
    }

    zoomUsersThatCanAcceptBookings = await zoomUsersThatCanAcceptBookings;

    if (!zoomUsersThatCanAcceptBookings) {
      throw new Error(
        `We're sorry but all our reprentatives are not available on this date. Please select another date`
      );
    }

    const meeting = await this.createZoomMeeting(
      zoomUsersThatCanAcceptBookings,
      client,
      va,
      date,
      timezone
    );

    if (zoomUsersThatCanAcceptBookings.userId) {
      const user = await supabase
        .from('users')
        .select('googleRefreshToken')
        .eq('uid', zoomUsersThatCanAcceptBookings.userId)
        .maybeSingle();

      if (user.data?.googleRefreshToken) {
        // do not wait
        this.createGoogleCalendarEvent(
          meeting,
          client,
          va,
          date,
          timezone,
          user.data?.googleRefreshToken
        ).catch(console.error);
      }
    }

    await transaction('zoomUsers')
      .update({
        assignedMeetingsCounter:
          Number(zoomUsersThatCanAcceptBookings.assignedMeetingsCounter || 0) +
          1,
      })
      .where('id', zoomUsersThatCanAcceptBookings.id);

    await transaction('virtualAssistants')
      .update({
        status: 'booked',
      })
      .where('id', va.id);

    // insert to bookings table
    const booking = {
      clientId: client.uid,
      virtualAssistantId: va.id,
      dateTime: date.format(),
      zoomId: meeting.id,
      zoomPassword: meeting.password,
      zoomLink: meeting.joinUrl,
    };

    await transaction('bookings').insert(booking);

    // do not wait
    sendMeetingInvitations(meeting).catch(console.error);
  });
};

exports.createGoogleCalendarEvent = async (
  meeting,
  client,
  va,
  date,
  timezone,
  token
) => {
  const tokens = await getValidTokenFromServer(token);

  const oAuth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oAuth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

  const eventStartTime = date.format();
  const eventEndTime = date.add(MEETING_DURATION, 'minutes').format();

  const attendees = [];

  if (client?.email) {
    attendees.push({ email: client.email });
  }

  if (va?.email) {
    attendees.push({ email: va.email });
  }

  const event = {
    summary: `MedVA Candidate Interview - ${va.firstName} ${va.lastName}`,
    location: meeting?.joinUrl,
    description: `Virtual assistant interview - ${meeting.joinUrl}`,
    start: {
      dateTime: eventStartTime,
      timeZone: timezone,
    },
    end: {
      dateTime: eventEndTime,
      timeZone: timezone,
    },
    colorId: 1,
    attendees,
  };

  console.log(`Creating google calendar event`);
  console.log(event);

  const { data } = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });

  const insert = {
    zoomMeetingId: meeting.id,
    googleCalendarId: data?.id,
    response: JSON.stringify(data),
  };

  await supabase.from('googleCalendars').insert(insert);
};

exports.createZoomMeeting = async (zoomUser, client, va, date, timezone) => {
  const attendees = [];

  if (client?.email) {
    attendees.push({ email: client.email });
  }

  if (va?.email) {
    attendees.push({ email: va.email });
  }

  const data = {
    topic: `MedVA Candidate Interview - ${va.firstName} ${va.lastName}`,
    calendar_type: 2,
    password: v4().split('-')[0],
    start_time: date.format(),
    duration: MEETING_DURATION,
    timezone: zoomTimezones[timezone],
    agenda: `Virtual assistant interview - ${va.firstName} ${va.lastName}`,
    settings: {
      meeting_invitees: attendees,
      registrants_email_notification: 'true',
      registrants_confirmation_email: 'true',
    },
  };

  console.log(data);

  const token = await getToken();

  const request = {
    url: `https://api.zoom.us/v2/users/${zoomUser.id}/meetings`,
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
    },
    data,
  };

  const { data: object = {} } = await axios.request(request);

  const allowance = await this.getAllowance();

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

  console.log(meeting);

  try {
    await db('zoomMeetings').insert(meeting).onConflict('id').merge();
  } catch (e) {
    console.error(e);
  }

  meeting.attendees = attendees;
  meeting.date = date.format();
  meeting.timezone = timezone;

  return meeting;
};

// this.getAvailableDates();
