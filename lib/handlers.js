//Dependencies
var _data = require('./data');
var helpers = require('./helpers');
const config = require('./config')

var handlers = {};
handlers.ping = function(data, callback){

    callback(200);
}

handlers.users = function(data, callback){
    
    var acceptableMethods = ['get', 'post', 'delete', 'put'];
    if(acceptableMethods.indexOf(data.method) > -1){
        //invoke particular method with data and callback
        handlers._users[data.method](data, callback)
    }else{
        callback(405)
    }
}

//containers for the user's submethods
handlers._users = {};

//users post
//Required data: firstName, lastName, phone, password, tosAgreement
//Optional data: none
handlers._users.post = function(data, callback){
    var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
    var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    var tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false;

    if(firstName && lastName && phone && password && tosAgreement){
        //Make sure that a user doesnt already exist
        _data.read('users', phone, function(err,data){
            if(err){
                //hash the password
                var hashedPassword = helpers.hash(password);
                if(hashedPassword){
                    //create a user object
                    var userObject = {
                        firstName,
                        lastName,
                        phone,
                        tosAgreement,
                        hashedPassword
                    }
                    //persist user
                    _data.create('users',phone,userObject,function(err){
                        if(!err){
                            callback(200);
                        }else{
                            console.log(" Error in creating user ", err);
                            callback(500, {'Error': " Error in creating user" })
                        }
                    })
                }else{
                    callback(500, {'Error': 'input a password '})
                }
            }else{
                //user already exists
                callback(400,{'Error': 'User with that phone number already exists'})
            }
        })
    }else{
        callback(400, {'Error': 'Missing required fields'});
        console.log(firstName && lastName && phone && password && tosAgreement)
        console.log(firstName, lastName,phone,password, tosAgreement )
    }
}

//users get
//Required data: phone
//optional data: none
handlers._users.get = function(data, callback){
    //check that the phone number is valid
    let phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){
        //get the token from the headers
        let token = typeof(data.headers.token) === 'string'? data.headers.token: false
        //verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsvalid){
            if(tokenIsvalid){
                //lookup the user
                _data.read('users',phone,function(err,data){
                    if(!err && data){
                        //remove hashed password from the user object before returning it to the user
                        delete data.hashedPassword;
                        callback(200, data)
                    }else{
                        callback(404);
                    }
                })
            }else{
                callback(403,{"Error": "Missing required token in header\'s or token is invalid"})
            }
        })


        
    }else{
        callback(400, {'Error': 'The phone number is missing'})
    }
}

//users put
//Required data: phone
//optional data: firstName, lastName, password( at least one must be specified)
handlers._users.put = function(data, callback){
    //check for the required data
    let phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;

    //check for optional fields
    let firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
    let lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

    //Error if phone is invalid
    if(phone){
        //Error if nothing is sent to update
        if(firstName||lastName||password){

            //get the token from the headers
            let token = typeof(data.headers.token) === 'string'? data.headers.token: false;

            //verify that the given token is valid for the phone number
            handlers._tokens.verifyToken(token, phone, function(tokenIsvalid){
                if(tokenIsvalid){
                    //Look up the user
                    _data.read('users', phone, function(err, userData){
                        if(!err && userData){
                            //update the necessary fields
                            if(firstName){
                                userData.firstName = firstName;
                            }
                            if(lastName){
                                userData.lastName = lastName;
                            }
                            if(password){
                                userData.hashedPassword = helpers.hash(password);
                            }
                            //store the new updates
                            _data.update('users',phone,userData,function(err){
                                if(!err){
                                    callback(200);
                                }else{
                                    console.log(err)
                                    callback(500, {'Error': 'There was an issue updating the user data'})
                                }
                            })
                        }else{
                            callback(400, {'Error': 'The specified user doesn\'t exist'})
                        }
                    })
                }else{
                    callback(403,{"Error": "Missing required token in header\'s or token is invalid"})
                }})
            
        }else{
            callback(400,{"Error": "Missing fields to update"})
        }
    }else{
        callback(400,{'Error': "Missing required field"})
    }
}


//users delete
//Required field: Phone
//@TODO delete any data files associated with this user
handlers._users.delete = function(data, callback){
    //check that the phone number is valid
    let phone = typeof(data.queryStringObject.phone) === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
    if(phone){

        //get the token from the headers
        let token = typeof(data.headers.token) === 'string'? data.headers.token: false;

        //verify that the given token is valid for the phone number
        handlers._tokens.verifyToken(token, phone, function(tokenIsvalid){
            if(tokenIsvalid){
                //lookup the user
                _data.read('users',phone,function(err,data){
                    if(!err && data){
                        _data.delete('users',phone,function(err){
                            if(!err){
                                callback(200)
                            }else{
                                callback(500,{"Error": "Could not delete the specified user"})
                            }
                        })
                    }else{
                        callback(400,{'Error': 'Could not find the specified user'});
                    }
                })
            }else{
                callback(403,{"Error": "Missing required token in header\'s or token is invalid"})
            }})

    }else{
        callback(400, {'Error': 'The phone number is missing'})
    }
}


handlers.notFound = function(data, callback){

    callback(404);
}

//Tokens
handlers.tokens = function(data, callback){
    
    var acceptableMethods = ['get', 'post', 'delete', 'put'];
    if(acceptableMethods.indexOf(data.method) > -1){
        //invoke particular method with data and callback
        handlers._tokens[data.method](data, callback)
    }else{
        callback(405)
    }
}

//container for all the token methods
handlers._tokens = {};

//Tokens -post
//Required data: phone, password
//Optional data: none
handlers._tokens.post = function(data,callback){
    let phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length > 0 ? data.payload.phone.trim() : false;
    let password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        //lookup the user who matches that phone number
        _data.read('users',phone,function(err, userData){
            if(!err && userData){
                //Hash the password and comparee it to the password in the usert object
                let hashedPassword = helpers.hash(password)
                if(hashedPassword === userData.hashedPassword){
                    //there's a match
                    //create a token with a random name, set expiry 1 hr into the future
                    let tokenId = helpers.createRandomString(20);
                    let expires = Date.now() + 1000 * 60 * 60;
                    let tokenObject = {
                        'id': tokenId,
                        expires,
                        phone
                    }

                    //store
                    _data.create('tokens',tokenId, tokenObject, function(err){
                        if(!err){
                            callback(200,tokenObject);
                        }else{
                            callback(500, {"Error": "could not create the token"})
                        }
                    })
                }else{
                    callback(400, {"Error": "The password didnot match the specified user\'s stored password"})
                }
            }else{
                callback(400,{'Error': "There is no user that matches that phone number"})
            }
        })
    }else{
        callback(400,{"Error": "Missing the required fields"})
    }
}

//Tokens -get
//Required data: id
//Optional data: none
handlers._tokens.get = function(data,callback){
    //check that the id is valid
    let id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        //lookup the token
        _data.read('tokens',id,function(err,tokenData){
            if(!err && tokenData){
                callback(200, tokenData)
            }else{
                callback(404);
            }
        })
    }else{
        callback(400, {'Error': 'Missing required field'})
    }
}

//Tokens -put
//Required Data: id, extend
//Optional data: none
handlers._tokens.put = function(data,callback){
    let id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length === 20 ? data.payload.id.trim() : false;
    let extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false;
    if(id && extend){
        //lookup the token
        _data.read('tokens', id, function(err, tokenData){
            if(!err && tokenData){
                //check to make sure token isn't expired
                if(tokenData.expires > Date.now()){
                    //set the expiration a date from now
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    //store the new updates
                    _data.update('tokens', id,tokenData,function(err){
                        if(!err){
                            callback(200)
                        }else{
                            callback(500,{"Error": "Could not update the token\'s expiration"})
                        }
                    })
                }else{
                    callback(400,{"Error": "Token has already expired and cannot be extended"})
                }
            }else{
                callback(400, {"Error": "Specified token doesnot exist"})
            }
        })
    }else{
        callback(400, {"Error": "Missing required field(s) or field(s) are invalid"})
    }

}

//Tokens -delete
//Required data: id
//Optional data: none

handlers._tokens.delete = function(data,callback){
    //check that the id is valid
    let id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id.trim() : false;
    if(id){
        //lookup the user
        _data.read('tokens',id,function(err,data){
            if(!err && data){
                _data.delete('tokens',id,function(err){
                    if(!err){
                        callback(200)
                    }else{
                        callback(500,{"Error": "Could not delete the specified token"})
                    }
                })
            }else{
                callback(400,{'Error': 'Could not find the specified token'});
            }
        })
    }else{
        callback(400, {'Error': 'The token is missing'})
    }
}

//verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function(id, phone, callback){
    //lookup the token
    _data.read('tokens', id, function(err,tokenData){
        if(!err && tokenData){
            //check that the token is for the given user and has not expired
            if(tokenData.phone === phone && tokenData.expires > Date.now()){
                callback(true)
            }else{
                callback(false)
            }
        }else{
            callback(false)
        }
    })
}

// Checks
handlers.checks = function(data,callback){
    var acceptableMethods = ['post','get','put','delete'];
    if(acceptableMethods.indexOf(data.method) > -1){
      handlers._checks[data.method](data,callback);
    } else {
      callback(405);
    }
  };
  
  // Container for all the checks methods
  handlers._checks  = {};
  
  
  // Checks - post
  // Required data: protocol,url,method,successCodes,timeoutSeconds
  // Optional data: none
  handlers._checks.post = function(data,callback){
    // Validate inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
    if(protocol && url && method && successCodes && timeoutSeconds){
  
      // Get token from headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  
      // Lookup the user phone by reading the token
      _data.read('tokens',token,function(err,tokenData){
        if(!err && tokenData){
          var userPhone = tokenData.phone;
  
          // Lookup the user data
          _data.read('users',userPhone,function(err,userData){
            if(!err && userData){
              var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
              // Verify that user has less than the number of max-checks per user
              if(userChecks.length < config.maxChecks){
                // Create random id for check
                var checkId = helpers.createRandomString(20);
  
                // Create check object including userPhone
                var checkObject = {
                  'id' : checkId,
                  'userPhone' : userPhone,
                  'protocol' : protocol,
                  'url' : url,
                  'method' : method,
                  'successCodes' : successCodes,
                  'timeoutSeconds' : timeoutSeconds
                };
  
                // Save the object
                _data.create('checks',checkId,checkObject,function(err){
                  if(!err){
                    // Add check id to the user's object
                    userData.checks = userChecks;
                    userData.checks.push(checkId);
  
                    // Save the new user data
                    _data.update('users',userPhone,userData,function(err){
                      if(!err){
                        // Return the data about the new check
                        callback(200,checkObject);
                      } else {
                        callback(500,{'Error' : 'Could not update the user with the new check.'});
                      }
                    });
                  } else {
                    callback(500,{'Error' : 'Could not create the new check'});
                  }
                });
  
  
  
              } else {
                callback(400,{'Error' : 'The user already has the maximum number of checks ('+config.maxChecks+').'})
              }
  
  
            } else {
              callback(403);
            }
          });
  
  
        } else {
          callback(403);
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required inputs, or inputs are invalid'});
    }
  };
  
  // Checks - get
  // Required data: id
  // Optional data: none
  handlers._checks.get = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          console.log("This is check data",checkData);
          handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
              // Return check data
              callback(200,checkData);
            } else {
              callback(403);
            }
          });
        } else {
          callback(404);
        }
      });
    } else {
      callback(400,{'Error' : 'Missing required field, or field invalid'})
    }
  };
  
  // Checks - put
  // Required data: id
  // Optional data: protocol,url,method,successCodes,timeoutSeconds (one must be sent)
  handlers._checks.put = function(data,callback){
    // Check for required field
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  
    // Check for optional fields
    var protocol = typeof(data.payload.protocol) == 'string' && ['https','http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post','get','put','delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;
  
    // Error if id is invalid
    if(id){
      // Error if nothing is sent to update
      if(protocol || url || method || successCodes || timeoutSeconds){
        // Lookup the check
        _data.read('checks',id,function(err,checkData){
          if(!err && checkData){
            // Get the token that sent the request
            var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
            // Verify that the given token is valid and belongs to the user who created the check
            handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
              if(tokenIsValid){
                // Update check data where necessary
                if(protocol){
                  checkData.protocol = protocol;
                }
                if(url){
                  checkData.url = url;
                }
                if(method){
                  checkData.method = method;
                }
                if(successCodes){
                  checkData.successCodes = successCodes;
                }
                if(timeoutSeconds){
                  checkData.timeoutSeconds = timeoutSeconds;
                }
  
                // Store the new updates
                _data.update('checks',id,checkData,function(err){
                  if(!err){
                    callback(200);
                  } else {
                    callback(500,{'Error' : 'Could not update the check.'});
                  }
                });
              } else {
                callback(403);
              }
            });
          } else {
            callback(400,{'Error' : 'Check ID did not exist.'});
          }
        });
      } else {
        callback(400,{'Error' : 'Missing fields to update.'});
      }
    } else {
      callback(400,{'Error' : 'Missing required field.'});
    }
  };
  
  
  // Checks - delete
  // Required data: id
  // Optional data: none
  handlers._checks.delete = function(data,callback){
    // Check that id is valid
    var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
    if(id){
      // Lookup the check
      _data.read('checks',id,function(err,checkData){
        if(!err && checkData){
          // Get the token that sent the request
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
          // Verify that the given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token,checkData.userPhone,function(tokenIsValid){
            if(tokenIsValid){
  
              // Delete the check data
              _data.delete('checks',id,function(err){
                if(!err){
                  // Lookup the user's object to get all their checks
                  _data.read('users',checkData.userPhone,function(err,userData){
                    if(!err){
                      var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
  
                      // Remove the deleted check from their list of checks
                      var checkPosition = userChecks.indexOf(id);
                      if(checkPosition > -1){
                        userChecks.splice(checkPosition,1);
                        // Re-save the user's data
                        userData.checks = userChecks;
                        _data.update('users',checkData.userPhone,userData,function(err){
                          if(!err){
                            callback(200);
                          } else {
                            callback(500,{'Error' : 'Could not update the user.'});
                          }
                        });
                      } else {
                        callback(500,{"Error" : "Could not find the check on the user's object, so could not remove it."});
                      }
                    } else {
                      callback(500,{"Error" : "Could not find the user who created the check, so could not remove the check from the list of checks on their user object."});
                    }
                  });
                } else {
                  callback(500,{"Error" : "Could not delete the check data."})
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400,{"Error" : "The check ID specified could not be found"});
        }
      });
    } else {
      callback(400,{"Error" : "Missing valid id"});
    }
  };

module.exports = handlers;
