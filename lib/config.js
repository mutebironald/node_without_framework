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
    'maxChecks': 5,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
    }
}

//production environment
environments.production = {
    'envName': 'production',
    'httpPort': 5000,
    'httpsPort': 5001,
    'hashingSecret': 'ThisisASecret',
    'maxChecks': 5,
    'twilio' : {
        'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone' : '+15005550006'
    }
}

//Determine which environment was passed on the commandline
var currentEnvironment = typeof(process.env.NODE_ENV) !== 'string' ? '' : process.env.NODE_ENV.toLowerCase();

//check that the environment passed is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

//export the module
module.exports = environmentToExport;
