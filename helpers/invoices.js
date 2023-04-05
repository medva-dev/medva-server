const { supabase } = require('./supabase');
const db = require('../_init');

const { tblTimesheet } = require('./tables');

exports.generateInvoice = async (start, end) => {
  const projects = await db(tblTimesheet)
    .distinct('tdProjectId')
    .whereBetween('date', [start, end]);

  for await (const project of projects) {
    try {
      console.log(`Processing project id ${project.tdProjectId}`);
      await db.transaction(async (transaction) => {
        const timesheets = await transaction(tblTimesheet)
          .where('tdProjectId', project.tdProjectId)
          .whereBetween('date', [start, end])
          .where('status', 'approved');

        if (timesheets.length < 1) {
          console.log('No timesheets found');
          return;
        }

        const items = {};

        timesheets.forEach((timesheet) => {
          const key = `${timesheet.tdProjectId}-${timesheet.tdUserId}`;

          if (!items[key]) {
            items[key] = {
              tdProjectId: timesheet.tdProjectId,
              tdUserId: timesheet.tdUserId,
              startDate: start,
              endDate: end,
              ratePerHour: Number(timesheet.ratePerHour),
              totalHours: 0,
              totalPay: 0,
              timesheetIds: [],
            };
          }

          items[key].totalHours += Number(timesheet.approvedHours);
          items[key].timesheetIds.push(timesheet.id);
        });

        const invoice = {
          tdProjectId: project.tdProjectId,
          date: end,
          dueDate: end,
          subTotal: 0,
          extra: [],
          total: 0,
        };

        Object.values(items).forEach((item) => {
          item.totalPay = Number(
            Number(item.totalHours * item.ratePerHour).toFixed(2)
          );

          invoice.subTotal += item.totalPay;
        });

        invoice.total += invoice.subTotal || 0;
        invoice.extra = JSON.stringify(invoice.extra);

        // insert invoice now
        const invoiceId = (
          await transaction('invoices').insert(invoice).returning('id')
        )?.[0].id;

        if (!invoiceId) {
          throw new Error('No invoice ID returned after inserting');
        }

        for await (const item of Object.values(items)) {
          const insert = { ...item };
          delete insert.timesheetIds;
          insert.invoiceId = invoiceId;

          const invoiceItemId = (
            await transaction('invoiceItems').insert(insert).returning('id')
          )?.[0].id;

          const itemDetails = item.timesheetIds.map((timesheetId) => ({
            timesheetId,
            invoiceId,
            invoiceItemId,
          }));

          await transaction('invoiceItemDetails').insert(itemDetails);
        }

        console.log(
          `Successfully inserted new invoice id ${invoiceId} with total of ${invoice.total}`
        );
      });
    } catch (e) {
      console.log(e);
    }
    console.log('\n');
  }

  await supabase
    .from('system')
    .update({
      value: { date: end },
    })
    .eq('name', 'lastDateOfInvoiceGeneration');
};
