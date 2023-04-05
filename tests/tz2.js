const moment = require('moment-timezone');

const time = '2023-03-24T23:03:07Z';

const start = moment(time);
const end = moment(time).add(30, 'minutes').add(15, 'minutes');
console.log(start, end);
