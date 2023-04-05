const express = require('express');
const parser = require('body-parser');
const nocache = require('nocache');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
// const fs = require('fs');
// const path = require('path');
const { CronJob } = require('cron');
const { API_PATH, API_PORT } = require('./config/initialize');
const { LIMITER } = require('./config/const');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

app.disable('x-powered-by');
app.use(nocache());

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.parse.failed') {
    res.status(400).send({ message: MESSAGES.error_parsing });
  } else {
    next();
  }
});

app.options('*', cors());
app.use(cors());

const clients = require('./routes/clients');
const admin = require('./routes/admin');

app.use('/check', (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: 'Ok',
    date: new Date(),
  };

  try {
    const ip = (
      req.headers['x-forwarded-for'] || req.socket.remoteAddress
    ).split(',')[0];

    console.log(`health check from ${ip} with uptime of ${data.uptime}`);
  } catch (e) {
    console.log(`Errored in health check:`, e.message);
  }

  res.status(200).send(data);
});

const limiter = rateLimit({
  windowMs: LIMITER.time,
  max: LIMITER.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    res.status(400).send({ message: 'TOO_MANY_REQUESTS' });
  },
});

app.use(limiter);
app.use(API_PATH, clients);
app.use(API_PATH, admin);

server.listen(API_PORT, () =>
  console.log(`Server running on port ${API_PORT}`)
);

io.on('connection', (socket) => {
  console.log('a user connected');
});
