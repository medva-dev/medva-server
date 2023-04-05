const supabase = require('../_init');
const axios = require('axios');

const {
  tblSystem,
  tblTdUsers,
  tblTdProjects,
  tblTdProjectTags,
  tblTdProjectUsers,
  tblTdTags,
  tblTdTagManagers,
  tblTdTasks,
} = require('./tables');
const { TIMEDOCTOR_COMPANY_ID } = require('../config/const');

const functions = {};

const instance = axios.create({
  baseURL: 'https://api2.timedoctor.com/api/1.0/',
  params: { company: TIMEDOCTOR_COMPANY_ID },
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

functions.instance = instance;

functions.login = async () => {
  console.log('logging in');
  const email = process.env.TIMEDOCTOR_EMAIL;
  const password = process.env.TIMEDOCTOR_PASSWORD;

  try {
    const { data = {} } = await instance.post('authorization/login', {
      email,
      password,
    });

    if (!data?.token) {
      throw new Error(`No token found from response`);
    }

    const { token, expiresAt, id: userId } = data;
    const insert = { name: 'tdToken', value: { token, expiresAt, userId } };

    // delete existing token
    await supabase(tblSystem).where('name', 'tdToken').del();

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
    .where('name', 'tdToken')
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
      limit: 500,
      page: cursor,
      deleted,
    },
  };

  const { data, paging } = await instance.request(request);

  console.log(`Found total of ${data.length} users`);

  let saved = 0;

  if (data.length > 0) {
    await supabase.transaction(async (transaction) => {
      for await (const user of data) {
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
        const check = await transaction(tblTdUsers).where('id', id).first();

        if (!check) {
          // save to table
          await transaction(tblTdUsers).insert({
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
          console.log(`Successfully inserted ${name} with id ${id}`);
          saved++;
        } else if (check.active !== active) {
          // update active status
          await transaction(tblTdUsers)
            .update({ active })
            .where('id', check.id);
          console.log(
            `Successfully updated ${name} with active status of ${active}`
          );
          saved++;
        }
      }
    });
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllUsers(token, paging.next, deleted);
  }

  console.log(`Saving ${saved} users done`);
};

functions.saveAllProjects = async (token = null, cursor = 0) => {
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
      limit: 500,
      page: cursor,
      detail: 'users',
      user: 'all-self',
      deleted: 'include',
    },
  };

  const { data, paging } = await instance.request(request);
  console.log(`Found total of ${data.length} projects`);

  if (data.length > 0) {
    await supabase.transaction(async (transaction) => {
      for await (const project of data) {
        const { id, scope, creatorId, name, deleted, users } = project;

        const check = await transaction(tblTdProjects).where('id', id).first();
        if (!check) {
          // save the project
          await transaction(tblTdProjects).insert({
            id,
            scope,
            creatorId,
            name,
            deleted,
          });
          console.log(`Successfully inserted project id ${id} - ${name}`);
        }

        // delete all existing data in tdProjectUsers
        await transaction(tblTdProjectUsers).del().where('tdProjectId', id);
        console.log(`Succesfully deleted users of project id ${id}`);

        // delete all existing data in tdProjectTags
        await transaction(tblTdProjectTags).del().where('tdProjectId', id);
        console.log(`Succesfully deleted tags of project id ${id}`);

        const projectUsers = [];
        const projectTags = [];

        users?.map((user) => {
          if (user.role === 'tag') {
            projectTags.push({
              tdProjectId: id,
              tdTagId: user.id,
            });
          } else if (user.role === 'user') {
            projectUsers.push({
              tdProjectId: id,
              tdUserId: user.id,
            });
          } else {
            throw new Error(`Unknown project role: ${user.role}`);
          }
        });

        if (projectUsers.length > 0) {
          await transaction(tblTdProjectUsers).insert(projectUsers);
          console.log(`Successfully inserted project users of ${name}`);
          console.log(
            `Successfully inserted ${projectUsers.length} users to project ${name}`
          );
        }

        if (projectTags.length > 0) {
          await transaction(tblTdProjectTags).insert(projectTags);
          console.log(`Successfully inserted project tags of ${name}`);
          console.log(
            `Successfully inserted ${projectTags.length} tags to project ${name}`
          );
        }
      }
    });
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllProjects(token, paging.next);
  }

  console.log(`Saving projects done`);
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
      limit: 500,
      page: cursor,
    },
  };

  const { data, paging } = await instance.request(request);

  console.log(`Found total of ${data.length} tags`);

  if (data.length > 0) {
    await supabase.transaction(async (transaction) => {
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

        const check = await transaction(tblTdTags).where('id', id).first();
        if (check) {
          // update
          await transaction(tblTdTags).update({ users }).where('id', id);
          console.log(`Successfully updated tag id ${id}`);
        } else {
          // insert new tag
          try {
            await transaction(tblTdTags).insert({
              id,
              creatorId,
              name,
              special,
              users,
              deleted,
              createdAt,
            });
          } catch (e) {
            console.log(tag);
            console.log(e);
            throw e;
          }
          console.log(`Successfully inserted new tag id ${id}`);
        }

        const tagManagers = managers.map((m) => ({
          tdUserId: m,
          tdTagId: id,
        }));

        await transaction(tblTdTagManagers).del().where('tdTagId', id);
        console.log(`Successfully deleted tag managers of ${id} - ${name}`);

        if (tagManagers.length > 0) {
          await transaction(tblTdTagManagers).insert(tagManagers);
          console.log(
            `Successfull inserted ${tagManagers.length} managers to tag ${name}`
          );
        }
      }
    });
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllTags(token, paging.next);
  }

  console.log(`Saving tags done`);
};

functions.saveAllTasks = async (token = null, cursor = 0) => {
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
      limit: 500,
      page: cursor,
    },
  };

  const { data, paging } = await instance.request(request);

  console.log(`Found total of ${data.length} tasks`);

  if (data.length > 0) {
    await supabase.transaction(async (transaction) => {
      for await (const task of data) {
        const { id, name, project, status, deleted } = task;
        const tdProjectId = project?.id;

        if (tdProjectId) {
          const check = await transaction(tblTdTasks).where('id', id).first();
          if (!check) {
            // insert new task
            try {
              await transaction(tblTdTasks).insert({
                id,
                name,
                tdProjectId,
                status,
                deleted,
              });
            } catch (e) {
              console.log(task);
              throw e;
            }
            console.log(`Successfully inserted task - ${name}`);
          } else {
            if (status !== check.status || deleted !== check.deleted) {
              // update
              await transaction(tblTdTasks)
                .update({ status, deleted })
                .where('id', check.id);
            }
            console.log(`Successfully updated task - ${name}`);
          }
        }
      }
    });
  }

  if (Number(paging?.next) > 0) {
    await functions.saveAllTasks(token, paging.next);
  }

  console.log(`Saving tasks done`);
};

module.exports = functions;
