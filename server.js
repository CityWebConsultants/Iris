/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var config = require('./config');
var qs = require('querystring');

//API functions

var chat = {};
chat.api = {};

// Automatically load modules
config.modules_enabled.forEach( function (element, index) {
    chat.api['/' + element] = require('./chat_modules/' + element);
    console.log(element + " module enabled");
});

//Server and request function router

http.createServer(function (req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
    });

    var body;
    req.on('data', function (data) {
        body += data;

        req.on('end', function () {
            var post = qs.parse(body);
            
            if(chat.api[req.url]){
             
                chat.api[req.url](res, body);
                
            } else {
             
                res.end("invalid response");
                
            }
            
        });
    });

    //Functions, each get a request argument and paramaters

}).listen(config.port);
