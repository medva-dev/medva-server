const axios = require('axios');
const knex = require('knex');
const moment = require('moment-timezone');
const zoomTimezones = require('./timezones.json');
const mail = require('./mail');

const db = knex({
  client: 'pg',
  pool: {
    min: 0,
    max: 7,
  },
  connection: {
    host: 'db.qszrlpquzvomtegibqkl.supabase.co',
    user: 'postgres',
    password: 'Mh5FVBkxVeNObleb',
    database: 'postgres',
  },
});

const createZoom = async (
  clientName,
  clientEmail,
  virtualAssistantEmail,
  date,
  timezone
) => {
  const token =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOm51bGwsImlzcyI6Inc2Z3lDdWtLUzdPcWkwNk1qa0ZrbHciLCJleHAiOjE2NzY3NjY0MDIsImlhdCI6MTY3NjE2MTYwMn0.GpgeW-GFTKhPehEoGVvg8ZeTcmOC5Qttl9tKFySggdU';

  const zoomTimezone = zoomTimezones[timezone] ?? undefined;

  const request = {
    headers: {
      Authorization: 'Bearer ' + token,
      'User-Agent': 'Zoom-api-Jwt-Request',
      'content-type': 'application/json',
    },
    method: 'POST',
    url: 'https://api.zoom.us/v2/users/me/meetings',
    data: {
      topic: `Appointment: ${clientName}`,
      calendar_type: 2,
      start_time: date,
      duration: 30,
      timezone: zoomTimezone,
      agenda: 'I would like to know more about you',
      settings: {
        meeting_invitees: [
          { email: clientEmail },
          { email: virtualAssistantEmail },
        ],
      },
    },
  };

  const { data } = await axios.request(request);

  return {
    ...data,
    request: {
      topic: `Appointment: ${clientName}`,
      calendar_type: 2,
      start_time: date,
      duration: 30,
      timezone,
      agenda: 'I would like to know more about you',
      settings: {
        meeting_invitees: [
          { email: clientEmail },
          { email: virtualAssistantEmail },
        ],
      },
    },
  };
};

exports.handler = async (event) => {
  let body = {};
  try {
    body = JSON.parse(event.body) || {};
  } catch (e) {
    body = {};
  }

  const response = {
    statusCode: 200,
    body: {},
  };

  try {
    const { type, table, record } = body ?? {};
    if (type !== 'INSERT') {
      throw new Error('Invalid type');
    }

    if (table !== 'bookings') {
      throw new Error('This function is for table "bookings" only');
    }

    const { id, date, time, timezone } = record;

    if ((Number(id ?? 0) || 0) < 1) {
      throw new Error(`No booking id`);
    }

    try {
      if (!date) {
        throw new Error(`No date`);
      }

      if (!time) {
        throw new Error(`No time`);
      }

      if (!timezone) {
        throw new Error(`No timezone`);
      }

      const dateTime = moment.tz(`${date} ${time}`, timezone);

      if (!dateTime.isValid()) {
        throw new Error(`Invalid date`);
      }

      const update = {};

      await db.transaction(async (transaction) => {
        const booking = await transaction('bookings as b')
          .join('virtualAssistants as va', 'va.id', 'b.virtualAssistantId')
          .join('clients as c', 'c.id', 'b.clientId')
          .where('b.id', id)
          .select(
            'b.id',
            'c.id as clientId',
            'c.name as clientName',
            'c.email as clientEmail',
            'va.firstName as virtualAssistantName',
            'va.email as virtualAssistantEmail'
          )
          .first();

        if (!booking) {
          throw new Error(`Booking id # ${id} not found`);
        }

        const zoom =
          (await createZoom(
            booking.clientName,
            booking.clientEmail,
            booking.virtualAssistantEmail,
            dateTime.format(),
            timezone
          )) || {};

        update.zoomId = zoom.id;
        update.zoomPassword = zoom.password;
        update.zoomLink = zoom.join_url;

        await transaction('bookings').update(update).where('id', id);

        update.clientEmail = booking.clientEmail;
        update.virtualAssistantEmail = booking.virtualAssistantEmail;
        update.clientName = booking.clientName;

        response.body = {
          successMessage: `Successfully updated booking id # ${id}`,
          update,
          booking,
          zoom,
          zoomRequest: {
            cname: booking.clientName,
            cemail: booking.clientEmail,
            vemail: booking.virtualAssistantEmail,
            time: dateTime.format(),
            timezone,
          },
        };
      });

      const emailResponse = await mail.sendInvitations(update);

      update.emailResponse = emailResponse;
    } catch (e) {
      // update zoomError field
      await db('bookings')
        .update({
          zoomError: e.message,
        })
        .where('id', id);

      throw e;
    }
  } catch (e) {
    response.statusCode = 400;
    response.body = { message: e.message };
  }
  return response;
};
