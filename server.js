/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var config = require('./config');
var qs = require('querystring');

//API functions

var chat = {};
chat.api = {};

// Automatically load modules
config.modules_enabled.forEach(function (element, index) {
    var elementName = element.name.split('_').join('/');
    chat.api['/' + elementName] = require('./chat_modules/' + element.name);
    chat.api['/' + elementName].options = element.options;
    console.log(element.name + " module enabled");
});

//Server and request function router

http.createServer(function (req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
    });

    if (req.method === "POST") {
        
        //Check if POST request is empty
        
        if (req.headers["content-length"] === "0") {
           
            res.end("Empty request");
            
        }
        
        var body;
        req.on('data', function (data) {

            body += data;

            req.on('end', function () {
                var post = qs.parse(body);

                if (chat.api[req.url] && chat.api[req.url].rest) {

                    chat.api[req.url].rest(res, body, chat.api[req.url].options);

                } else {

                    res.end("invalid response");

                }

            });
        });
    } else {
        
        //GET or other request
        res.end("GET?");
        
    }

    //Functions, each get a request argument and paramaters

}).listen(config.port);
