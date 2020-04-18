//Dependencies
var _data = require('./data');
var helpers = require('./helpers');

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

module.exports = handlers;
