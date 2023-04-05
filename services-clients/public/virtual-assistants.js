const joi = require('joi');
const { supabase } = require('../../helpers/supabase');
const schema = joi
  .object({
    category: joi.string().allow('dental', 'medical'),
    subCategories: joi.object({
      receptionist: joi.boolean().default(false),
      scribe: joi.boolean().default(false),
      biller: joi.boolean().default(false),
    }),
    page: joi.number().required().default(1),
    search: joi.string().allow(null, ''),
  })
  .options({ stripUnknown: true });

const fetch = async (db, options = {}) => {
  const { category, subCategories, page: nextPage, search } = options;

  const filteredVa = {};
  if (typeof search === 'string' && search.trim() !== '') {
    const text = `%${search.trim()}%`;
    await db.transaction(async (transaction) => {
      const certifications = await transaction('certifications')
        .select('virtualAssistantId')
        .where('name', 'ilike', text);

      const education = await transaction('education')
        .select('virtualAssistantId')
        .where('name', 'ilike', text);

      const experiences = await transaction('experiences')
        .select('virtualAssistantId')
        .where('name', 'ilike', text);

      const professions = await transaction('professions')
        .select('virtualAssistantId')
        .where('profession', 'ilike', text);

      const trainings = await transaction('trainings')
        .select('virtualAssistantId')
        .where('name', 'ilike', text);

      certifications.forEach((x) => {
        filteredVa[x.virtualAssistantId] = true;
      });
      education.forEach((x) => {
        filteredVa[x.virtualAssistantId] = true;
      });

      experiences.forEach((x) => {
        filteredVa[x.virtualAssistantId] = true;
      });

      professions.forEach((x) => {
        filteredVa[x.virtualAssistantId] = true;
      });

      trainings.forEach((x) => {
        filteredVa[x.virtualAssistantId] = true;
      });
    });
  }

  const select =
    'id, firstName, lastName, registeredNurse, medicalDegree, hasExperience, category, subCategory, country, avatar, video, status,rating, professions(profession), experiences(name)';

  const page = Number(nextPage ?? 1) || 1;
  const pageSize = 12;

  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

  const prepare = supabase.from('virtualAssistants').select(select, {
    count: 'exact',
  });

  if (category) {
    prepare.match({
      category: String(category).toUpperCase(),
    });
  }

  const filter = [];
  Object.keys(subCategories || {}).forEach((sub) => {
    if (subCategories[sub] === true) {
      filter.push(String(sub).toUpperCase());
    }
  });

  if (filter.length > 0) {
    prepare.filter('subCategory', 'in', `(${filter.join(',')})`);
  }

  if (Object.keys(filteredVa).length > 0) {
    prepare.filter('id', 'in', `(${Object.keys(filteredVa).join(',')})`);
  } else if (search) {
    prepare.filter('id', 'in', `(0)`);
  }

  prepare.filter('status', 'in', '(open,booked)');

  prepare.range(rangeFrom, rangeTo);

  const result = await prepare;

  const { data, error, count } = result;

  if (error) {
    throw error;
  }

  let totalPages = count / pageSize;
  if (totalPages % 1 === 0) {
    totalPages = Math.floor(totalPages);
  } else {
    totalPages = Math.floor(totalPages) + 1;
  }

  return {
    list: data,
    count,
    pageSize,
    currentPage: page,
    totalPages,
  };
};

module.exports = async (db, data) => {
  const values = await schema.validateAsync(data);
  const result = await fetch(db, values);
  return result;
};
