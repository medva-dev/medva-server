const supabase = require('../_init');
const fonts = require('./fonts');
const moment = require('moment');
const PdfPrinter = require('pdfmake');
const printer = new PdfPrinter(fonts);

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const format = (value) => {
  const noSpace = formatter.format(value);
  return noSpace.replace(/([\d,.]+)$/, ' $1');
};

const defaultPaper = {
  pageSize: 'LETTER',
  pageOrientation: 'portrait',
  fontSize: 10,
};

const header = require('./pdfs/header');
const summary = require('./pdfs/summary');
const table = require('./pdfs/table');
const totals = require('./pdfs/totals');
const timesheet = require('./pdfs/timesheet');

module.exports = async (id = 0, res) => {
  if (!id) {
    throw new Error('Invalid invoice id');
  }

  let info = {};
  let names = {};

  await supabase.transaction(async (transaction) => {
    const invoice = await transaction('invoices as i')
      .where('i.id', id)
      .join('tdProjects as p', 'p.id', 'i.tdProjectId')
      .join('invoiceItems as items', 'items.invoiceId', 'i.id')
      .select('i.*', 'p.name as projectName')
      .first();

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const items = await transaction('invoiceItems as items')
      .where('invoiceId', invoice.id)
      .join('tdUsers as u', 'u.id', 'items.tdUserId')
      .select('items.*', 'u.name')
      .orderBy('u.name', 'asc');

    const extras = [{ label: 'Subtotal', amount: format(invoice.subTotal) }];

    invoice.extra?.forEach((e) => {
      extras.push({ label: e.name, amount: format(e.amount) });
    });

    const details = [];
    items.forEach((item) => {
      details.push({
        name: item.name,
        startDate: moment(item.startDate).format('MMM DD, YYYY'),
        endDate: moment(item.endDate).format('MMM DD, YYYY'),
        hours: item.totalHours,
        rate: format(item.ratePerHour),
        amount: format(item.totalPay),
      });
    });

    info = {
      id: String(invoice.id).padStart(6, '0'),
      date: moment(invoice.date).format('MMMM DD, YYYY'),
      dueDate: moment(invoice.dueDate).format('MMMM DD, YYYY'),
      companyName: invoice.projectName,
      companyAddress: ['Address 1', 'Address 2', 'Address 3'],
      details,
      extras,
      total: {
        label: 'Amount due',
        amount: format(invoice.total),
      },
    };

    for await (const item of items) {
      const { name, id } = item;
      const timesheet = await transaction('invoiceItemDetails as i')
        .where('invoiceItemId', id)
        .join('timesheets as t', 't.id', 'i.timesheetId')
        .select('t.*')
        .orderBy('t.date');

      const array = [];
      let total = 0;

      timesheet.forEach((t) => {
        array.push({
          name,
          date: moment(t.date).format('MMM DD, YYYY'),
          hours: t.approvedHours,
          rate: format(t.ratePerHour),
          total: format(t.total),
        });
        total += Number(t.total);
      });

      names[name] = {
        array,
        total: format(total),
      };
    }
  });

  const invoicePage = [header(), summary(info), table(info), totals(info)];
  const timesheets = [];

  Object.values(names).forEach((ts) => {
    const itemsPage = [
      { text: '', pageBreak: 'before' },
      header('TIMESHEET'),
      timesheet(ts),
    ];
    timesheets.push(itemsPage);
  });

  const docDefinition = {
    ...defaultPaper,
    content: [...invoicePage, ...timesheets],
  };

  if (res) {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      pdfDoc.pipe(res);
      pdfDoc.end();
      return { success: true };
    } catch (e) {
      console.error(e);
    }
  } else {
    throw new Error('Invalid http request');
  }
};
