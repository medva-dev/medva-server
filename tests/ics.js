const ics = require('ics');
const moment = require('moment');
const { writeFileSync } = require('fs');

const start = moment('2023-02-12T08:30')
  .format('YYYY-M-D-H-m')
  .split('-')
  .map((x) => Number(x));

ics.createEvent(
  {
    start,
    duration: { minutes: 30 },
    title: 'Test Calendar',
    description: 'Annual 10-kilometer run in Boulder, Colorado',
    location: 'Folsom Field, University of Colorado (finish line)',
    url: 'https://us05web.zoom.us/j/89846047170?pwd=bk1PYjViQzI4S2NiT25nQ29IaURUQT09',
    geo: { lat: 40.0095, lon: 105.2669 },
    categories: ['10k races', 'Memorial Day Weekend', 'Boulder CO'],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: 'Admin', email: 'Race@BolderBOULDER.com' },
    attendees: [
      {
        name: 'Nigel Lopez',
        email: 'nigelstefanlopez@gmail.com',
        partstat: 'ACCEPTED',
        role: 'REQ-PARTICIPANT',
      },
      {
        name: 'Elaine Lopez',
        email: 'love.elenalopez@gmail.com',
        role: 'OPT-PARTICIPANT',
      },
    ],
  },
  (error, value) => {
    console.log(value);
    if (error) {
      console.log(error);
    }

    writeFileSync(`${__dirname}/event.ics`, value);
  }
);
