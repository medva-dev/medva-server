require('colors');
const router = require('express').Router();
const path = require('path');
const fs = require('fs');

const servicesPath = path.join(__dirname, '../services-clients');
const db = require('../_init');
const { validate } = require('../helpers/auth');

// const PUBLIC_SERVICES = require('../config/public_services');

const info = (method = '', file = '', user = '', data = null) => {
  console.log(method.yellow, file.green, user.yellow, data);
};

const error = (method = '', file = '', message = '') => {
  console.log(method.bgRed, file.green, message.red);
};

router.post('/:service/:filename', async (req, res) => {
  const { service, filename } = req.params;

  req.body.ip = (
    req.headers['x-forwarded-for'] || req.socket.remoteAddress
  ).split(',')[0];

  // TODO: remove commented codes after everything, for now, I need this delay when testing displays in the client side
  // await new Promise((resolve) => {
  //   setTimeout(resolve, 500);
  // });

  try {
    const file = path.join(servicesPath, service, `${filename}.js`);

    if (!fs.existsSync(file)) {
      throw new Error(`Cannot find '${service}/${filename}'`);
    }

    let user;

    // for api testing purposes (ThunderClient)
    if (req.body.ip === '::ffff:127.0.0.1') {
      req.body.ip = '::1';
    }

    if (service !== 'public') {
      user = await validate(req);
    }

    // to log user's request in cloudwatch
    info(
      req.method,
      `${service}/${filename}`,
      String(user?.email || ''),
      req.body
    );

    const response = await require(file)(db, req.body, user, req, res);

    // TODO: remove commented codes after everything, for now, I need this delay when testing displays in the client side
    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });

    res.send(response);

    // to log response
    // info(req.method, `${service}/${filename}`, 'response', response);
  } catch (e) {
    if (e.sqlMessage) {
      e.message = e.sqlMessage;
    }

    if (typeof e.message === 'object') {
      e.message = JSON.stringify(e.message);
    }

    res.status(400).send({ message: e.message, logout: e.logout });
    error(req.method, `${service}/${filename}`, `${e}`);
  }
});

module.exports = router;
