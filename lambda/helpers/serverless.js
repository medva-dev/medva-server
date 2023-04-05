const SSM = require('aws-sdk/clients/ssm');
const dotenv = require('dotenv');

module.exports.getParameters = async ({ resolveConfigurationProperty }) => {
  const name = await resolveConfigurationProperty(['service']);
  const region = await resolveConfigurationProperty(['provider', 'region']);
  const stage = await resolveConfigurationProperty(['provider', 'stage']);
  let parameterStore = await resolveConfigurationProperty([
    'custom',
    'parameterStore',
  ]);

  parameterStore = String(parameterStore).replace('{stage}', stage);

  const ssm = new SSM({ region });

  const object = {};

  try {
    console.log('Fetching parameter store', parameterStore);
    const policy = await ssm
      .getParameter({
        Name: parameterStore,
      })
      .promise();

    if (policy?.Parameter?.Value) {
      const buffer = Buffer.from(policy.Parameter.Value);
      const config = dotenv.parse(buffer);
      Object.assign(object, config);
    }
  } catch (e) {
    console.log(e);
    console.log('Error in fetching parameter store', parameterStore);
    process.exit();
  }

  return object;
};
