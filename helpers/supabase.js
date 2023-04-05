const joi = require('joi');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.SUPABASE_URL) {
  require('../_init');
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

exports.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

exports.tableListSchema = joi
  .object({
    table: joi.string().required(),
    selects: joi.object().required(),
    newPage: joi.number().required().default(0),
    newPageSize: joi.number().required().default(10),
    order: joi.string().allow(null, ''),
    desc: joi.bool().required().default(false),
    status: joi.string().allow(null, ''),
    search: joi
      .object({
        column: joi.string().required().allow(null, ''),
        keyword: joi.string().required().allow(null, ''),
        overrideSelects: joi.object().allow(null),
      })
      .allow(null),
  })
  .options({ stripUnknown: true });

exports.tableListResult = async (form) => {
  const { table, selects, newPage, newPageSize, search, order, desc, status } =
    await this.tableListSchema.validateAsync(form);

  const currentPage = Number(newPage ?? 1) || 1;
  const pageSize = Number(newPageSize ?? 10) || 10;
  const rangeFrom = (currentPage - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;
  const keyword = String(search?.keyword ?? '').trim();
  const { column, overrideSelects = {} } = search ?? {};

  const finalSelect = [];

  Object.keys(selects).forEach((tableName) => {
    if (overrideSelects?.[tableName] && keyword.length > 0) {
      finalSelect.push(overrideSelects[tableName]);
    } else {
      finalSelect.push(selects[tableName]);
    }
  });

  const prepare = this.supabase
    .from(table)
    .select(finalSelect.join(), {
      count: 'exact',
    })
    .range(rangeFrom, rangeTo);

  if (column && keyword.length > 0) {
    void prepare.ilike(column, `%${keyword}%`);
  }

  if (status) {
    void prepare.eq('status', status);
  }

  if (order) {
    void prepare.order(order, { ascending: desc !== true });
  }

  const { data, error, count } = await prepare;

  if (error) {
    if (error.code === 'PGRST103') {
      // means the range is not satisfiable
      // remake the request but change the page number  to 0
      return this.tableListResult({ ...props, newPage: 0 });
    }

    throw new Error(error.message);
  }

  let totalPages = Number(count ?? 0) / pageSize;

  if (totalPages % 1 === 0) {
    totalPages = Math.floor(totalPages);
  } else {
    totalPages = Math.floor(totalPages) + 1;
  }

  return { data, count, pageSize, currentPage, totalPages };
};
