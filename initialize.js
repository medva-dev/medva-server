require('colors');
const MAX_MODIFIED_MINUTES = 5;
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const inquirer = require('inquirer');
const moment = require('moment');
const format = require('string-template');
const { forEach } = require('async-foreach');
const db = require('./_init');
const { createClient } = require('@supabase/supabase-js');

const createTables = async (drop = []) => {
  const tables = path.join(__dirname, './_tables');
  const files = await fs.promises.readdir(tables);

  await db.transaction(async (transaction) => {
    await new Promise((resolve) => {
      forEach(
        files,
        async function (file) {
          const done = this.async();

          if (file.startsWith('_')) {
            return done();
          }

          try {
            const tableName = file.split('.')[0];
            if (drop.includes(tableName)) {
              await transaction.schema.dropTableIfExists(tableName);
              console.log(`Successfully dropped ${tableName}`);
            } else {
              const exists = await transaction.schema.hasTable(tableName);
              if (!tableName.startsWith('view') && exists) {
                return done();
              }
            }

            // create here
            const func = require(path.join(tables, file));
            console.log(`Creating table "${tableName}"`);
            await func(transaction);
            console.log(`Successfully created table "${tableName}"`);
          } catch (e) {
            console.log(e.message);
          }
          done();
        },
        resolve
      );
    });

    const superUser = await transaction('auth.users')
      .where('email', 'nigelstefanlopez@gmail.com')
      .first();

    if (!superUser) {
      // create superUser
      const { SUPABASE_URL, SUPABASE_SERVICE_ROLE } = process.env;

      const mainSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

      const { data: authData, error: authError } =
        await mainSupabase.auth.admin.createUser({
          email: 'nigelstefanlopez@gmail.com',
          password: 'zxcv1234!',
          email_confirm: true,
          user_metadata: { name: 'Nigel Lopez' },
        });

      if (authError) {
        throw authError;
      }

      const { user } = authData;

      const insert = {
        uid: user.id,
        email: user.email,
        name: user.user_metadata.name,
        isSuperuser: true,
      };

      await transaction('users').insert(insert);
      console.log('Successfully created superuser');
    }

    await transaction.raw(
      `GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO supabase_auth_admin`
    );
  });
};

const runSqlFiles = async (folderName) => {
  const functions = path.join(__dirname, `./${folderName}`);
  const files = await fs.promises.readdir(functions);
  const splitNames = folderName === '_foreignKeys';

  await db.transaction(async (transaction) => {
    await new Promise((resolve) => {
      forEach(
        files,
        async function (file) {
          const done = this.async();
          try {
            if (file.indexOf('.sql') < 0) {
              throw new Error(`${file} is not a .sql file`);
            }

            if (file.startsWith('_')) {
              console.log('Skipping file');
              return done();
            }

            const functionName = file.split('.')[0];
            const rawSql = fs.readFileSync(path.join(functions, file), 'utf-8');

            const replace = {
              name: functionName,
            };

            if (splitNames) {
              const splitNames = functionName.split('-');
              replace.mainTable = splitNames[0];
              replace.foreignTable = splitNames[1];
            }

            const formattedSql = format(rawSql, replace);
            // console.log(formattedSql);
            console.log(
              `Running ${String(file).yellow} in ${String(folderName).cyan}`
            );

            await transaction.raw(formattedSql);

            console.log(
              `${String(file).yellow} in ${String(folderName).cyan} ${
                String('successful').green
              }\n`
            );
          } catch (e) {
            console.log(e.message);
            process.exit();
          }
          done();
        },
        resolve
      );
    });
  });
};

const importDefaults = async () => {
  console.log('\n\n');
  console.log('*** WARNING ***'.yellow);
  console.log('=> This will truncate the table of your choice!'.red);
  console.log('\n');

  const defaults = path.join(__dirname, './const');
  const files = await fs.promises.readdir(defaults);

  const validFiles = [];
  const recentModifications = [];
  for (const index in files) {
    const file = files[index];

    if (file.startsWith('_')) {
      continue;
    }
    const location = path.join(defaults, file);
    const stats = fs.statSync(location);
    const modifiedTime = moment(stats.mtime);
    const diff = moment.duration(moment().diff(modifiedTime)).asMinutes();

    const insert = {
      location,
      file,
      lastModified: diff,
      lastModifiedString: `${Number(diff).toFixed(0)} mins`,
    };

    validFiles.push(insert);

    if (diff <= MAX_MODIFIED_MINUTES) {
      recentModifications.push(insert);
    }
  }

  const choices = [];

  if (recentModifications.length > 0) {
    const recent = {
      name: `Recent modifications [${recentModifications
        .map((r) => r.file)
        .join(', ')}]`,
      value: recentModifications,
    };
    choices.push(recent);
    choices.push(new inquirer.Separator());
  }

  const sorted = _.sortBy(validFiles, 'file');
  sorted.forEach((f) => {
    choices.push({
      name: f.file,
      value: [f],
    });
  });

  choices.push(new inquirer.Separator());
  choices.push({ name: 'Exit', value: [] });

  const { choice } = await inquirer.prompt([
    {
      name: 'choice',
      type: 'list',
      message: 'Select file to import',
      choices,
    },
  ]);

  if (choice.length < 1) {
    process.exit();
  }

  await db.transaction(async (transaction) => {
    await new Promise((resolve) => {
      forEach(
        choice,
        async function ({ location, file }) {
          const done = this.async();
          const name = String(file).split('.')[0];

          const check = await transaction(name).first();

          if (!check) {
            console.log('Table not found: '.red, `${name}`.bgRed);
            return;
          }

          const content = require(location);

          if (!Array.isArray(content) || content.length < 1) {
            console.log(`No content for ${file}`.red);
            return done();
          }

          console.log(`Truncating ${name}`.blue);
          await transaction(name).truncate();

          try {
            await transaction(name).insert(content);
            console.log(
              `Successfully inserted ${String(content.length).yellow} to ${
                String(name).green
              }`
            );
          } catch (e) {
            console.log(e.message);
            process.exit();
          }
          done();
        },
        resolve
      );
    });
  });
};

inquirer
  .prompt([
    {
      name: 'choice',
      type: 'list',
      message: 'What do you want?',
      choices: [
        'All tasks',
        'Create tables',
        'Run functions sql',
        'Run triggers sql',
        'Run RLS sql',
        'Import defaults',
      ],
    },
  ])
  .then(async ({ choice }) => {
    // Use user feedback for... whatever!!
    switch (choice) {
      case 'All tasks':
        // await createTables();
        break;
      case 'Create tables':
        await createTables();
        break;
      case 'Run functions sql':
        await runSqlFiles('_functions');
        break;
      case 'Run triggers sql':
        await runSqlFiles('_triggers');
        break;
      case 'Run RLS sql':
        await runSqlFiles('_rls');
        break;
      case 'Import defaults':
        await importDefaults();
        break;
    }

    process.exit();
  })
  .catch((error) => {
    console.log(error);
  });
