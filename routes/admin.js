require('colors');
const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const servicesPath = path.join(__dirname, '../services-admin');
const db = require('../_init');
const { validate } = require('../helpers/auth');
const upload = multer({ dest: 'uploads/' });

const info = (method = '', file = '', user = '', data = null) => {
  console.log(method.yellow, file.green, user.yellow, data);
};

const error = (method = '', file = '', message = '') => {
  console.log(method.bgRed, file.green, message.red);
};

router.post('/admin/:service/:filename', async (req, res) => {
  const { service, filename } = req.params;

  req.body.ip = (
    req.headers['x-forwarded-for'] || req.socket.remoteAddress
  ).split(',')[0];

  try {
    const file = path.join(servicesPath, service, `${filename}.js`);

    if (!fs.existsSync(file)) {
      throw new Error(`Cannot find '${service}/${filename}'`);
    }

    let user;

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

    res.send(response);
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

router.get('/admin/:service/:filename', async (req, res) => {
  try {
    const { service, filename } = req.params;
    const file = path.join(servicesPath, service, `${filename}.js`);

    if (!fs.existsSync(file)) {
      throw new Error(`Cannot find '${service}/${filename}'`);
    }

    const response = await require(file)(db, req, res);

    // res.send(response);
  } catch (e) {
    res.send({ message: e.message });
  }
});

module.exports = router;
