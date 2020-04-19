//helpers for various tasks

//dependencies
const crypto = require('crypto')
const config = require('./config')
const https = require('https');
const querystring = require('querystring');

//container for all the helpers
var helpers = {}

helpers.hash = function(str){
    if(typeof(str) === 'string' && str.length>0){
        var hash = crypto.createHmac('SHA256', config.hashingSecret).update(str).digest('hex');
        console.log('hash+++ ', hash)
        return hash;
    }else{
        console.log(" passwordish___++ ")
        return false;
    }
}

//create json object from string
helpers.parseJsonToObject = function(str){
    try{
        let obj = JSON.parse(str);
        return obj;
    }catch(e){
        return {};
    }
}

helpers.createRandomString = function(strLength){
    strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;
    if(strLength){
        //define all possible characters that could go into a string
        let possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789'

        //start the final string
        let str = "";
        for(i = 1; i <= strLength; i++){
            //Get a random character from the possible characters string
            let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length))
            //Append this character to the final string
            str += randomCharacter;
        }
        //return the final string
        return str;
    }else{
        return false;
    }
}

helpers.sendTwilioSMS = function(phone,msg,callback){
    //validate parameters
    phone = typeof(phone) === 'string' && phone.trim().length === 10? phone.trim() : false;
    msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg.trim() : false;
    if(phone && msg){
        //configure the request payload
        let payload = {
            'From': config.twilio.fromPhone,
            "To": "+256"+ phone,
            "Body": msg
        }
        //Stringify Payload
        let stringPayload = querystring.stringify(payload);

        //Configure the request details
        let requestDetails = {
            "protocol": "https:",
            "hostname": "api.twilio.com",
            "method": "POST",
            "path": "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
            "auth": config.twilio.accountSid + ":" + config.twilio.authToken,
            "headers": {
                "Content-Type": "application/x-www-form-urlencoded",
                "Content-Length": Buffer.byteLength(stringPayload)
            }

        }
        //Instantiate the request Object
        let req = https.request(requestDetails, function(res){
            //Grab the status of the request
            let status = res.statusCode;
            //Callback successfully if request went through
            if(status === 200 || status === 201){
                callback(false);
            }else{
                callback("Status code returned was " + status);
            }
        })

        //Bind the error event so it doesnt get thrown
        req.on('error', function(e){
            callback(e);
        })

        //Add the payload
        req.write(stringPayload);

        //end the request
        req.end();
    }else{
        callback('Given parameters are missing or invalid')
    }
}

module.exports = helpers;
