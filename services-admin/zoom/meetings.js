const moment = require('moment');
const { supabase } = require('../../helpers/supabase');

module.exports = async (db, form, user) => {
  const { uid } = user;
  const { data, error } = await supabase
    .from('zoomMeetings')
    .select('*, zoomUsers!inner(userId)')
    .eq('zoomUsers.userId', uid)
    .is('status', null);

  if (error) {
    throw error;
  }

  const meetings = {};

  const meetingIds = data?.map?.((meeting) => meeting.id) || [];

  const idMap = {};

  if (meetingIds?.length > 0) {
    const { data: bookings } = await supabase
      .from('bookings')
      .select(
        '*, clients!inner(name), virtualAssistants!inner(firstName, lastName)'
      )
      .filter('zoomId', 'in', `(${meetingIds.join(',')})`);
    bookings?.map?.((booking) => {
      idMap[booking.zoomId] = {
        client: booking.clients?.name || 'Not found',
        va: `${booking.virtualAssistants?.firstName} ${booking.virtualAssistants?.lastName}`,
      };
    });
  }

  data?.forEach?.((meeting) => {
    const date = moment(meeting.startTime);
    const day = date.format('YYYY-MM-DD');
    if (!meetings[day]) {
      meetings[day] = [];
    }

    console.log(meeting.id);

    meetings[day].push({
      id: meeting.id,
      uuid: meeting.uuid,
      startTime: meeting.startTime,
      time: date.format('hh:mm a'),
      endTime: meeting.endTime,
      topic: meeting.topic,
      timezone: meeting.timezone,
      joinUrl: meeting.joinUrl,
      client: idMap[meeting.id]?.client,
      va: idMap[meeting.id]?.va,
    });
  });

  return { meetings };
};
