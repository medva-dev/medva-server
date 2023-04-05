const joi = require('joi');
const moment = require('moment-timezone');
const { getAvailableDates, createMeeting } = require('../../helpers/meetings');
const { supabase } = require('../../helpers/supabase');
const schema = joi
  .object({
    id: joi.number().required().positive(),
    date: joi.string().length(10).required(),
    time: joi.string().length(8).required(),
    timezone: joi.string().required(),
  })
  .options({ stripUnknown: true });

const dateFormat = 'YYYY-MM-DD hh:mm a';

module.exports = async (db, form, user) => {
  const { id, date, time, timezone } = await schema.validateAsync(form);

  const va = await supabase
    .from('virtualAssistants')
    .select()
    .eq('id', id)
    .maybeSingle();
  if (va.error) {
    throw error;
  }

  if (!va.data) {
    throw new Error('Virtual assitant not found');
  }

  if (va.data?.status !== 'open') {
    throw new Error(
      `We're sorry but this virtual assistant has been booked recently, please select another virtual assistant`
    );
  }

  const validTimezone = !!(timezone ? moment.tz.zone(timezone) : null);

  if (!validTimezone) {
    throw new Error('Invalid timezone! Please tryo to refresh your browser');
  }

  const finalDate = moment.tz(`${date} ${time}`, dateFormat, timezone);

  if (!finalDate.isValid()) {
    throw new Error('Invalid date or time! Please try to refresh your browser');
  }

  finalDate.second(0);

  const { availableDates, allBlocks: blocksWithUnavailableUsers } =
    await getAvailableDates(timezone, finalDate);

  const checkDate = finalDate.format('YYYY-MM-DD');
  const checkTime = finalDate.format('hh:mm a');

  if (
    !availableDates[checkDate] ||
    availableDates[checkDate]?.indexOf?.(checkTime) < 0
  ) {
    throw new Error(
      `We're sorry but this date has been booked recently. Please select another date / time`
    );
  }

  const unavailableUsers = Object.keys(
    blocksWithUnavailableUsers[finalDate.format()] ?? {}
  );

  console.log('Trying to create meeting');
  await createMeeting(user, va.data, finalDate, timezone, unavailableUsers);

  return {
    successMessage: `We've successfully booked this schedule for you and for the virtual assistant. You should receive an email containing a link for the conference. Thank you!`,
  };
};
