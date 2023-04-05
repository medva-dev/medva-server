const joi = require('joi');
const moment = require('moment');
const { supabase } = require('../../helpers/supabase');
const { generateInvoice } = require('../../helpers/invoices');

const schema = joi
  .object({
    endDate: joi.string().length(10).required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, data, user) => {
  const { endDate } = await schema.validateAsync(data);

  const finalEndDate = moment(endDate);

  if (!finalEndDate.isValid()) {
    throw new Error('Invalid end date!');
  }

  const { data: last } = await supabase
    .from('system')
    .select()
    .eq('name', 'lastDateOfInvoiceGeneration')
    .maybeSingle();

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

  // run in background
  generateInvoice(
    startDate.format('YYYY-MM-DD'),
    finalEndDate.format('YYYY-MM-DD')
  );

  return { successMessage: 'Generating of invoices started successfully.' };
};
