require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const AWS = require('aws-sdk');
const inquirer = require('inquirer');
const AdmZip = require('adm-zip');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const sleep = require('sleep-promise');

const FUNCTIONS = require('./functions.json');

const select = async () => {
  const choices = [];
  Object.keys(FUNCTIONS).forEach((name) => {
    choices.push({ name, value: FUNCTIONS[name] });
  });

  const { choice } = await inquirer.prompt([
    {
      name: 'choice',
      type: 'list',
      message: 'Select an action',
      choices,
    },
  ]);

  return choice;
};

const getParamStore = async (selected) => {
  const SSM = new AWS.SSM({ region: selected.region });
  console.log('Fetching Parameter Store', selected.parameterStore);
  const params = await SSM.getParameter({
    Name: selected.parameterStore,
  }).promise();
  const object = {};
  if (params?.Parameter?.Value) {
    const buffer = Buffer.from(params.Parameter.Value);
    const config = dotenv.parse(buffer);
    Object.assign(object, config);
  }
  return object;
};

const zipFile = async () => {
  const source = path.join(__dirname);
  const zip = new AdmZip();
  await zip.addLocalFolderPromise(source);

  console.log(`Compressing source`);

  return zip.toBufferPromise();
};

const updateFunctionCode = async (selected) => {
  const lambda = new AWS.Lambda({ region: selected.region });
  try {
    const source = await zipFile();
    console.log('Updating function code');
    const response = await lambda
      .updateFunctionCode({
        FunctionName: selected.functionName,
        ZipFile: source,
      })
      .promise();

    console.log(response);
    console.log(
      `\n\nSuccessfully updated the source code of ${selected.functionName}\n\n`
    );
  } catch (e) {
    console.log(e);
  }
};

const updateFunctionEnv = async (selected) => {
  const lambda = new AWS.Lambda({ region: selected.region });

  try {
    const variables = await getParamStore(selected);
    console.log(`Updating environment variables`);
    await lambda
      .updateFunctionConfiguration({
        FunctionName: selected.functionName,
        Environment: { Variables: variables },
        Handler: selected.handler || 'index.js',
        Timeout: selected.timeout || undefined,
      })
      .promise();
    console.log(`Successfully updated environment variables`);
    // console.log(`Sleeping for 3 seconds`);
    // await sleep(3000);
  } catch (e) {
    console.log(e);
  }
};

const execute = async () => {
  const selected = await select();

  if (selected.parameterStore) {
    await updateFunctionEnv(selected);
  }

  await updateFunctionCode(selected);
};

execute();
