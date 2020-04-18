//helpers for various tasks

//dependencies
const crypto = require('crypto')
const config = require('./config')
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

module.exports = helpers;
