const joi = require('joi');
const _ = require('lodash');
const moment = require('moment-timezone');
const momentDurationFormatSetup = require('moment-duration-format');
const axios = require('axios');
const COMPANY_TIMEZONE = 'America/Los_Angeles';

momentDurationFormatSetup(moment);

const supabase = require('./supabase');
const { systemTdToken } = require('../consts/system');
const {
  tblSystem,
  tblTdUsers,
  tblTdProjects,
  tblTdProjectTags,
  tblTdProjectUsers,
  tblTdTags,
  tblTdTagManagers,
  tblTdTasks,
  tblTimesheet,
} = require('../consts/tables');
const { company } = require('../consts/config');

const functions = {};

const instance = axios.create({
  baseURL: 'https://api2.timedoctor.com/api/1.0/',
  params: { company },
});

instance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const service = 'td';
    const { request, response = {}, code, config } = error;
    const { status, statusText, data = {} } = response;

    const message =
      data?.message ??
      statusText ??
      JSON.stringify({ status, statusText, data });

    const { host, path, method } = request ?? {};
    const { responseUrl } = request?.res?.client?._httpMessage?.res ?? {};
    let body = {};

    try {
      body = JSON.parse(config?.data);
    } catch (e) {
      body = {
        parseError: e.message,
        configData: JSON.stringify(config?.data) || 'no data',
      };
    }

    const returnData = {
      service,
      response: data,
      message,
      status,
      statusText,
      code,
      host,
      path,
      method,
      responseUrl,
      body,
    };

    try {
      const x = await supabase('httpRequests')
        .insert(returnData)
        .returning('id');

      const insertId = x[0]?.id;
      returnData.insertId = insertId;

      console.log(
        `Inserted error to "httpRequests" table with id # ${insertId}`
      );
    } catch (e) {
      console.log('httpRequests Error:', e.message);
    }

    throw returnData;
  }
);

functions.intance = instance;

functions.login = async () => {
  const email = 'nigelstefanlopez@gmail.com';
  const password = '_MedVADEV1030';

  try {
    const { data = {} } = await instance.post('authorization/login', {
      email,
      password,
    });

    if (!data?.token) {
      throw new Error(`No token found from response`);
    }

    const { token, expiresAt, id: userId } = data;
    const insert = { name: systemTdToken, value: { token, expiresAt, userId } };

    // delete existing token
    await supabase(tblSystem).where('name', systemTdToken).del();

    // insert new token
    await supabase(tblSystem).insert(insert);

    return { token, expiresAt, userId };
  } catch (e) {
    console.log(`Login Error:`, e.message);
    throw e;
  }
};

functions.verifyToken = async (token, userId) => {
  const request = {
    method: 'GET',
    params: { token },
    url: `/users/${userId}`,
  };

  await instance.request(request);
};

functions.getToken = async () => {
  const systemSavedToken = await supabase(tblSystem)
    .where('name', systemTdToken)
    .first();

  let token;
  let userId;

  if (!systemSavedToken) {
    const login = await functions.login();
    token = login.token;
    userId = login.userId;
  } else if (systemSavedToken?.value?.token) {
    token = systemSavedToken.value.token;
    userId = systemSavedToken.value.userId;
  } else {
    throw new Error(`No token found`);
  }

  await functions.verifyToken(token, userId);

  return { token, userId };
};

functions.saveAllUsers = async (token = null, cursor = 0, deleted = false) => {
  console.log(`Fetching all users - cursor ${cursor}`);

  if (!token) {
    const { token: _token } = await functions.getToken();
    token = _token;
  }

  const request = {
    method: 'GET',
    url: '/users',
    params: {
      token,
      sort: 'created',
      limit: 400,
      page: cursor,
      deleted,
    },
  };

  const { data, paging } = await instance.request(request);

  console.log(`Found total of ${data.length} users`);

  let saved = 0;

  if (data.length > 0) {
    const insert = [];

    for (const user of data) {
      const {
        id,
        email,
        employeeId,
        role,
        name,
        hiredAt,
        createdAt,
        tagIds,
        active = false,
      } = user;

      insert.push({
        id,
        role,
        email,
        employeeId,
        name,
        hiredAt,
        createdAt,
        associatedIds: { tagIds },
        active,
      });
    }

    await supabase(tblTdUsers).insert(insert).onConflict('id').merge();
    console.log(
      `Successfully inserted / updated ${insert.length} to ${tblTdUsers} table`
    );
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllUsers(token, paging.next, deleted);
  }
};

functions.saveAllProjects = async (
  token = null,
  cursor = 0,
  deleted = undefined
) => {
  console.log(`Fetching all projects - cursor ${cursor}`);

  if (!token) {
    const { token: _token } = await functions.getToken();
    token = _token;
  }

  const request = {
    method: 'GET',
    url: '/projects',
    params: {
      token,
      limit: 400,
      page: cursor,
      detail: 'users',
      user: 'all-self',
      deleted,
    },
  };

  const { data, paging } = await instance.request(request);
  console.log(`Found total of ${data.length} projects`);

  if (data.length > 0) {
    const projectInserts = [];
    const projectUsers = [];
    const projectTags = [];
    const projectIds = [];

    for (const project of data) {
      const { id, scope, creatorId, name, deleted, users } = project;

      projectInserts.push({
        id,
        scope,
        creatorId,
        name,
        deleted,
      });

      if (projectIds.indexOf(id) < 0) {
        projectIds.push(id);
      }

      users?.map((user) => {
        if (user.role === 'tag') {
          if (user.id && user.id !== 'undefined') {
            projectTags.push({
              tdProjectId: id,
              tdTagId: user.id,
            });
          }
        } else if (user.role === 'user') {
          if (user.id && user.id !== 'undefined') {
            projectUsers.push({
              tdProjectId: id,
              tdUserId: user.id,
            });
          }
        } else {
          throw new Error(`Unknown project role: ${user.role}`);
        }
      });
    }

    if (projectInserts.length > 0) {
      await supabase(tblTdProjects)
        .insert(projectInserts)
        .onConflict('id')
        .merge();
    }

    if (projectIds.length > 0) {
      // delete all existing data in tdProjectUsers
      await supabase(tblTdProjectUsers)
        .del()
        .whereIn('tdProjectId', projectIds);
      console.log(`Succesfully deleted project users`);

      // delete all existing data in tdProjectTags
      await supabase(tblTdProjectTags).del().whereIn('tdProjectId', projectIds);
      console.log(`Succesfully deleted project tags`);
    }

    if (projectUsers.length > 0) {
      await supabase(tblTdProjectUsers).insert(projectUsers);
      console.log(`Succesfully inserted ${projectUsers.length} users`);
    }
    if (projectTags.length > 0) {
      await supabase(tblTdProjectTags).insert(projectTags);
      console.log(`Succesfully inserted ${projectTags.length} tags`);
    }

    console.log('\n');
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllProjects(token, paging.next, deleted);
  }
};

functions.saveAllTags = async (token = null, cursor = 0) => {
  console.log(`Fetching all tags - cursor ${cursor}`);

  if (!token) {
    const { token: _token } = await functions.getToken();
    token = _token;
  }

  const request = {
    method: 'GET',
    url: '/tags',
    params: {
      token,
      limit: 400,
      page: cursor,
    },
  };

  const { data, paging } = await instance.request(request);

  console.log(`Found total of ${data.length} tags`);

  if (data.length > 0) {
    const inserts = [];
    const tagManagerInserts = [];
    const tagIds = [];

    for await (const tag of data) {
      const {
        id,
        creatorId,
        name,
        special,
        users,
        deleted,
        createdAt,
        managers,
      } = tag;

      inserts.push({
        id,
        creatorId,
        name,
        special,
        users,
        deleted,
        createdAt,
      });

      if (tagIds.indexOf(id) < 0) {
        tagIds.push(id);
      }

      const tagManagers = managers.map((m) => ({
        tdUserId: m,
        tdTagId: id,
      }));

      tagManagerInserts.push(...tagManagers);
    }
    if (tagIds.length > 0) {
      await supabase(tblTdTagManagers).del().whereIn('tdTagId', tagIds);
      console.log(`Successfully deleted tag managers`);
    }

    if (inserts.length > 0) {
      await supabase(tblTdTags).insert(inserts).onConflict('id').merge();
      console.log(`Successfully inserted ${inserts.length} tags`);
    }

    if (tagManagerInserts.length > 0) {
      await supabase(tblTdTagManagers).insert(tagManagerInserts);
    }

    console.log('\n');
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllTags(token, paging.next);
  }
};

functions.saveAllTasks = async (
  token = null,
  cursor = 0,
  deleted = undefined
) => {
  console.log(`Fetching all tasks - cursor ${cursor}`);

  if (!token) {
    const { token: _token } = await functions.getToken();
    token = _token;
  }

  const request = {
    method: 'GET',
    url: '/tasks',
    params: {
      token,
      limit: 400,
      page: cursor,
      deleted,
    },
  };

  const { data, paging } = await instance.request(request);

  console.log(`Found total of ${data.length} tasks`);

  if (data.length > 0) {
    const inserts = [];

    for (const task of data) {
      const { id, name, project, status, deleted } = task;
      const tdProjectId = project?.id;

      if (tdProjectId) {
        inserts.push({
          id,
          name,
          tdProjectId,
          status,
          deleted,
        });
      }
    }

    if (inserts.length > 0) {
      await supabase(tblTdTasks).insert(inserts).onConflict('id').merge();
      console.log(`Successfully inserted ${inserts.length} tasks`);
    }
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllTasks(token, paging.next, deleted);
  }
};

functions.saveAllWorklogs = async () => {
  const restrictedProjects = ['YvPCbe681KZimBH-', 'Y-uQjVR9yvdJ-N19'];

  const { token } = await functions.getToken();

  const schema = joi
    .object({
      start: joi.string().required(),
      time: joi.number().required(),
      mode: joi.string().required(),
      userId: joi.string().required(),
      taskId: joi.string().required(),
      projectId: joi.string().required(),
      reason: joi.string().allow('', null),
      deviceId: joi.string().required(),
      editTimeId: joi.string().allow('', null),
    })
    .options({ stripUnknown: true });

  let users = (await supabase('tdUsers').select('id')).map(({ id }) => id);

  users = _.chunk(users, 100);

  for await (const batchedUsers of users) {
    const request = {
      method: 'GET',
      url: '/activity/worklog',
      params: {
        token,
        user: batchedUsers.join(),
        from: '2023-02-28 00:00:00',
      },
    };

    const { data } = await instance.request(request);
    if (Array.isArray(data)) {
      const insert = [];
      for await (const logs of data) {
        if (logs.length < 1) {
          continue;
        }

        for await (let log of logs) {
          try {
            log = await schema.validateAsync(log);

            log.tdProjectId = log.projectId;
            log.tdUserId = log.userId;
            log.tdTaskId = log.taskId;

            delete log.projectId;
            delete log.userId;
            delete log.taskId;

            if (restrictedProjects.indexOf(log.tdProjectId) < 0) {
              insert.push(log);
            }
          } catch (e) {
            console.log(e);
            continue;
          }
        }
      }

      if (insert.length > 0) {
        try {
          await supabase('tdWorklogs')
            .insert(insert)
            .onConflict(['tdUserId', 'start'])
            .merge();
          console.log(`Successfully inserted ${insert.length} logs`);
        } catch (e) {
          console.log(insert);
          console.log(e);
          process.exit();
        }
      }
    }
  }

  console.log(`Saving worklogs done`);
};

// functions.generateInvoice = async (projectId, maxDate) => {
//   if (!projectId) {
//     throw new Error('No project id provided');
//   }
//   if (!maxDate) {
//     throw new Error('No maximum date provided');
//   }

//   await supabase.transaction(async (transaction) => {
//     const project = await transaction('tdProjects')
//       .where('id', projectId)
//       .first();

//     if (!project) {
//       throw new Error('Project not found');
//     }

//     const timesheets = await transaction('timesheets').where('')
//   });
// };

functions.worklogsToTimesheet = async (
  date = moment().tz(COMPANY_TIMEZONE).add(-1, 'day').format('YYYY-MM-DD')
) => {
  const companyDate = moment(date).tz(COMPANY_TIMEZONE);

  if (!companyDate.isValid()) {
    throw new Error('Invalid date conversion');
  }

  const start = companyDate.startOf('day').format();
  const end = companyDate.endOf('day').format();

  await supabase.transaction(async (transaction) => {
    console.log(`Fetching data with date range of "${start}" and ${end}`);

    const worklogs = await transaction('tdWorklogs').whereBetween('start', [
      start,
      end,
    ]);

    const timesheets = {};
    const timesheetDate = companyDate.format('YYYY-MM-DD');

    worklogs.forEach(({ tdUserId, tdProjectId, time }) => {
      const key = `${tdUserId}-${tdProjectId}`;

      if (!timesheets[key]) {
        timesheets[key] = {
          tdProjectId,
          tdUserId,
          date: timesheetDate,
          seconds: 0,
          hours: 0,
          approvedHours: 0,
          ratePerHour: 10,
          total: 0,
        };
      }

      const timesheet = timesheets[key];
      timesheet.seconds += time;
    });

    const inserts = [];

    Object.values(timesheets).forEach((timesheet) => {
      const duration = moment.duration(timesheet.seconds || 0, 'seconds');
      const hours = Number(Number(duration.asHours() || 0).toFixed(2));
      let approvedHours = hours;

      if (hours > 8 && hours < 8.5) {
        approvedHours = parseInt(hours); // do not include decimals
      }

      timesheet.approvedHours = approvedHours;
      timesheet.hours = hours;
      timesheet.total = approvedHours * timesheet.ratePerHour;

      if (hours > 0.5) {
        inserts.push(timesheet);
      }
    });

    if (inserts.length > 0) {
      await supabase(tblTimesheet)
        .insert(inserts)
        .onConflict(['date', 'tdProjectId', 'tdUserId'])
        .merge();
      console.log(
        `Successfully inserted ${inserts.length} for date ${timesheetDate}`
      );
    }
  });
  console.log('\n');
};

const worklogToTimesheetByRange = async () => {
  const date = moment('2023-01-31T00:00:00-08:00').tz(COMPANY_TIMEZONE);

  const dates = [];
  const max = moment().tz(COMPANY_TIMEZONE);

  while (date.isBefore(max)) {
    dates.push(date.format('YYYY-MM-DD'));
    date.add(1, 'day');
  }

  for await (let d of dates) {
    try {
      await functions.worklogsToTimesheet(d);
    } catch (e) {
      console.log(e.message);
    }
  }
};

functions.generateInvoice = async (start, end) => {
  const projects = await supabase(tblTimesheet)
    .distinct('tdProjectId')
    .whereBetween('date', [start, end]);

  for await (const project of projects) {
    try {
      console.log(`Processing project id ${project.tdProjectId}`);
      await supabase.transaction(async (transaction) => {
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

        // 3% charge
        // invoice.extra.push({
        //   name: 'Credit card fee (3%)',
        //   amount: Number(Number(invoice.subTotal * 0.03).toFixed(2)),
        // });

        // invoice.extra.forEach((extra) => {
        //   invoice.total += Number(extra.amount || 0) || 0;
        // });

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

  await supabase('system')
    .where('name', 'lastDateOfInvoiceGeneration')
    .update({
      value: { date: end },
    });
};

module.exports = functions;

// (async () => {
//   try {
//     await functions.saveAllUsers();
//     await functions.saveAllUsers(null, 0, true);
//     await functions.saveAllTags();
//     await functions.saveAllProjects();
//     await functions.saveAllProjects(null, 0, true);
//     await functions.saveAllTasks();
//     await functions.saveAllTasks(null, 0, true);
//     await functions.saveAllWorklogs();
//     await functions.worklogsToTimesheet();
//     await functions.generateInvoice();
//     // process.exit();
//   } catch (e) {
//     console.log(e);
//     console.log(e.message);
//   }
// })();

// worklogToTimesheetByRange();
// functions.saveAllWorklogs();
