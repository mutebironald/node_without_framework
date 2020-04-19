const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./lib/config');
const handlers = require('./lib/handlers');
const helpers = require('./lib/helpers')



//Instantiating the http server
const httpServer = http.createServer(function(req,res){
    unifiedServer(req,res)
});

//listen to the http server
httpServer.listen(config.httpPort,()=>{

    console.log("listening on port ", config.httpPort)
});

//Instantiating the https server
const httpServerOptions = {
    'key': fs.readFileSync('./https/key.perm'),
    'cert': fs.readFileSync('./https/cert.pem')
}
const httpsServer = https.createServer(httpServerOptions,function(req,res){
    unifiedServer(req,res)
});

//listen to the https server
httpsServer.listen(config.httpsPort,()=>{

    console.log("listening on port ", config.httpsPort)
});

//all the server logic for the http and https server
var unifiedServer = function(req,res){
    //get the url and parse it
    var parsedUrl = url.parse(req.url,true);

    //try this
    // var myUrl = new URL(req.url);

    //the method
    var method = req.method.toLowerCase();

    //get the query string as an object
    var queryStringObject = parsedUrl.query;

    //get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //get the headers as an object
    var headers = req.headers;

    //get the payload if any
    var decoder = new StringDecoder('utf-8')
    var buffer = ""
    req.on('data', (data)=>{
        buffer += decoder.write(data)
    })
    req.on('end', ()=>{
        buffer += decoder.end();

        //this part will always be called wether there is payload data or not

        //choose a handler if it doesn't exist go to 404 handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'payload': helpers.parseJsonToObject(buffer),
            'method': method,
            'headers': headers,
            'queryStringObject': queryStringObject
        }

        // Route the request to the handler specified in the router
        chosenHandler(data, function(statusCode, payload){
            //use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

            //use the payload called back or default to an empty object
            payload = typeof(payload) === 'object'? payload: {};

            var payloadString = JSON.stringify(payload);

            //return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log("we are returning this response ", statusCode, payloadString)
        })

    })

}


var router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}
