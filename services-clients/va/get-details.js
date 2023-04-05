const joi = require('joi');
const lookup = require('country-code-lookup');

const { supabase } = require('../../helpers/supabase');
const { getAvailableDates } = require('../../helpers/meetings');

const schema = joi
  .object({
    id: joi.number().positive().required(),
    timezone: joi.string().required(),
  })
  .options({ stripUnknown: true });

module.exports = async (db, form, user) => {
  const { id, timezone } = await schema.validateAsync(form);

  const { data, error } = await supabase
    .from('virtualAssistants')
    .select(
      '*, education(name), trainings(name),experiences(name), certifications(name)'
    )
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Cannot find virtual assistant');
  }

  const country = lookup.byCountry(data?.country);

  if (country) {
    data.flag = `https://flagsapi.com/${country.iso2}/shiny/32.png`;
  }

  const dates = await getAvailableDates(timezone);

  // console.log(dates);
  data.dates = {
    availableDates: dates.availableDates,
    timezone: dates.timezone,
  };

  return data;
};
