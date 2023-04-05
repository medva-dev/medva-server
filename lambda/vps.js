const PORT = 3030;
const crypto = require('crypto');
const moment = require('moment');
const md5 = require('md5');
const express = require('express');
const parser = require('body-parser');
const nocache = require('nocache');
const cors = require('cors');
const invoicePdf = require('./helpers/invoices');
const supabase = require('./helpers/supabase');
const { generateInvoice } = require('./helpers/timedoctor');
const zoom = require('./zoom/index');

const app = express();

app.use(parser.json());
app.use(parser.urlencoded({ extended: true }));

app.disable('x-powered-by');
app.use(nocache());

app.options('*', cors());
app.use(cors());

app.get('/', (req, res) => {
  res.send('hello');
});

app.get('/invoices/:id/:hash', async (req, res) => {
  try {
    const { id, hash } = req.params ?? {};
    if (md5(String(id)) !== hash) {
      throw new Error('Invalid invoice');
    }
    await invoicePdf(id, res);
  } catch (e) {
    res.send({ message: e.message });
  }
});

app.get('/generate/:endDate', async (req, res) => {
  try {
    let { endDate } = req.params ?? {};

    if (!endDate || endDate.length !== 10) {
      throw new Error('Invalid date');
    }

    endDate = moment(endDate);

    if (!endDate.isValid()) {
      throw new Error('Invalid date');
    }

    const last = await supabase('system')
      .where('name', 'lastDateOfInvoiceGeneration')
      .first();

    if (!last || !last?.value?.date) {
      throw new Error('Invalid start date. Please contact administrator');
    }

    const startDate = moment(last.value.date);

    if (!startDate.isValid()) {
      throw new Error('Invalid start date. Please contact administrator');
    }

    startDate.add(1, 'day');

    if (startDate.isSameOrAfter(endDate)) {
      throw new Error(
        `End date must be greater than ${startDate.format('MMMM DD, YYYY')}`
      );
    }

    generateInvoice(
      startDate.format('YYYY-MM-DD'),
      endDate.format('YYYY-MM-DD')
    );

    res.send({
      successMessage: 'Generating of invoices started successfully.',
    });
  } catch (e) {
    res.send({ message: e.message });
  }
});

app.post('/zoom/webhooks', async (req, res) => {
  try {
    const data = req.body;
    // {
    //   "payload": {
    //     "plainToken": "6QArxFjkTg2aVWvNKPfnEA"
    //   },
    //   "event_ts": 1679661031432,
    //   "event": "endpoint.url_validation"
    // }

    const response = {};

    if (data?.event === 'endpoint.url_validation') {
      const hmac = crypto.createHmac('sha256', '4z_tkrkQRQ2ZkWNN1DkuLA');

      response.plainToken = data?.payload?.plainToken;
      response.encryptedToken = hmac
        .update(data?.payload?.plainToken)
        .digest('hex');
    }

    if (data?.event && data?.payload) {
      await zoom.handler({ body: JSON.stringify(data) });
    }

    res.send(response);
  } catch (e) {
    console.error(e);
    res.send({ message: e.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
