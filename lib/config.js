/**
 * create and export configuration variables
 */

var environments = {};

//staging (default) environment
environments.staging = {
    'envName': 'staging',
    'httpPort': 3000,
    'httpsPort': 3001,
    'hashingSecret': 'ThisisASecret',
    'maxChecks': 5
}

//production environment
environments.production = {
    'envName': 'production',
    'httpPort': 5000,
    'httpsPort': 5001,
    'hashingSecret': 'ThisisASecret',
    'maxChecks': 5
}

//Determine which environment was passed on the commandline
var currentEnvironment = typeof(process.env.NODE_ENV) !== 'string' ? '' : process.env.NODE_ENV.toLowerCase();

//check that the environment passed is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

//export the module
module.exports = environmentToExport;
