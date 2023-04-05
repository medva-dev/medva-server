const moment = require('moment-timezone');

const names = moment.tz.names();

const times = {};

names.forEach((name) => {
  const z = moment()
    .set('hour', 1)
    .set('minute', 30)
    .tz(name)
    .format('YYYY-MM-DD HH:mm');

  if (!times[z]) {
    times[z] = [];
  }

  times[z].push(name);
});

const zoomTimezones = [
  'Pacific/Midway',
  'Pacific/Pago_Pago',
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Vancouver',
  'America/Los_Angeles',
  'America/Tijuana',
  'America/Edmonton',
  'America/Denver',
  'America/Phoenix',
  'America/Mazatlan',
  'America/Winnipeg',
  'America/Regina',
  'America/Chicago',
  'America/Mexico_City',
  'America/Guatemala',
  'America/El_Salvador',
  'America/Managua',
  'America/Costa_Rica',
  'America/Montreal',
  'America/New_York',
  'America/Indianapolis',
  'America/Panama',
  'America/Bogota',
  'America/Lima',
  'America/Halifax',
  'America/Puerto_Rico',
  'America/Caracas',
  'America/Santiago',
  'America/St_Johns',
  'America/Montevideo',
  'America/Araguaina',
  'America/Argentina/Buenos_Aires',
  'America/Godthab',
  'America/Sao_Paulo',
  'Atlantic/Azores',
  'Canada/Atlantic',
  'Atlantic/Cape_Verde',
  'UTC',
  'Etc/Greenwich',
  'Europe/Belgrade',
  'CET',
  'Atlantic/Reykjavik',
  'Europe/Dublin',
  'Europe/London',
  'Europe/Lisbon',
  'Africa/Casablanca',
  'Africa/Nouakchott',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Brussels',
  'Europe/Berlin',
  'Europe/Helsinki',
  'Europe/Amsterdam',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Luxembourg',
  'Europe/Paris',
  'Europe/Zurich',
  'Europe/Madrid',
  'Africa/Bangui',
  'Africa/Algiers',
  'Africa/Tunis',
  'Africa/Harare',
  'Africa/Nairobi',
  'Europe/Warsaw',
  'Europe/Prague',
  'Europe/Budapest',
  'Europe/Sofia',
  'Europe/Istanbul',
  'Europe/Athens',
  'Europe/Bucharest',
  'Asia/Nicosia',
  'Asia/Beirut',
  'Asia/Damascus',
  'Asia/Jerusalem',
  'Asia/Amman',
  'Africa/Tripoli',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Europe/Moscow',
  'Asia/Baghdad',
  'Asia/Kuwait',
  'Asia/Riyadh',
  'Asia/Bahrain',
  'Asia/Qatar',
  'Asia/Aden',
  'Asia/Tehran',
  'Africa/Khartoum',
  'Africa/Djibouti',
  'Africa/Mogadishu',
  'Asia/Dubai',
  'Asia/Muscat',
  'Asia/Baku',
  'Asia/Kabul',
  'Asia/Yekaterinburg',
  'Asia/Tashkent',
  'Asia/Calcutta',
  'Asia/Kathmandu',
  'Asia/Novosibirsk',
  'Asia/Almaty',
  'Asia/Dacca',
  'Asia/Krasnoyarsk',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Saigon',
  'Asia/Jakarta',
  'Asia/Irkutsk',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Taipei',
  'Asia/Kuala_Lumpur',
  'Asia/Singapore',
  'Australia/Perth',
  'Asia/Yakutsk',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Darwin',
  'Australia/Adelaide',
  'Asia/Vladivostok',
  'Pacific/Port_Moresby',
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Hobart',
  'Asia/Magadan',
  'SST',
  'Pacific/Noumea',
  'Asia/Kamchatka',
  'Pacific/Fiji',
  'Pacific/Auckland',
  'Asia/Kolkata',
  'Europe/Kiev',
  'America/Tegucigalpa',
  'Pacific/Apia',
];

const finalObject = {};

Object.values(times).forEach((time) => {
  let parent;

  time.forEach((t) => {
    if (zoomTimezones.indexOf(t) > -1) {
      parent = t;
    }
  });

  if (parent) {
    time.forEach((t) => {
      finalObject[t] = parent;
    });
  }
});

const fs = require('fs');
fs.writeFileSync('timezones.json', JSON.stringify(finalObject, null, 2));
