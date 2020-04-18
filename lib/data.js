/**
 * library for storing and editing data
*/

//dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

//container for the module to be exported
var lib = {};

//base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

//write data to a file
lib.create = function(dir,file,data,callback){
    //open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor){
        if(!err && fileDescriptor){
            //convert data to string
            var stringData = JSON.stringify(data);

            //write to file and close it
            fs.writeFile(fileDescriptor, stringData, function(err){
                if(!err){
                    fs.close(fileDescriptor, function(err){
                        if(!err){
                            callback(false);
                        }else{
                            callback('Error closing new file')
                        }
                    })
                }else{
                    callback('Error writing to new file');
                }
            })
        }else{
            callback('Could not create new file, it may already exist')
        }
    })
}

//read data from a file
lib.read = function(dir,file,callback){
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', function(err, data){
       if(!err && data){
           let parsedData = helpers.parseJsonToObject(data)
           callback(false, parsedData);
       }else{
           callback(err, data);
       }
    })
}

//update data inside a file
lib.update = function(dir,file,data,callback){
    //open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err,fileDescriptor){
        if(!err && fileDescriptor){
            //convert data to string
            var stringData = JSON.stringify(data)
            fs.ftruncate(fileDescriptor, function(err){
                if(!err){
                    //write to file and close it
                    fs.writeFile(fileDescriptor, stringData, function(err){
                        if(!err){
                            fs.close(fileDescriptor, function(err){
                                if(!err){
                                    callback(false);
                                }else{
                                    callback('Error closing existing file');
                                }
                            })
                        }else{
                            callback("Error writing to existing file")
                        }
                    })
                }else{
                    callback('Error truncating file')
                }
            })
        }else{
            callback("could not open file for updating, file may not exist yet")
        }
    })
}

//delete a file
lib.delete = function(dir,file,callback){
    //unlink a file
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err){
        if(!err){
            callback(false);
        }else{
            callback('Error deleting the file')
        }
    })
}

//export the module
module.exports = lib;
