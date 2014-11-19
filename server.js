/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var config = require('./config');
var qs = require('querystring');
var io = require('socket.io');

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

var server = http.createServer(function (req, res) {
    res.writeHead(200, {
        'Access-Control-Allow-Origin': '*'
    });

    if (req.method === "POST") {
        
        //Check if POST request is empty
        
        if (req.headers["content-length"] === "0") {
           
            res.end("Empty request");
            
        }
        
        var body = '';
        req.on('data', function (data) {

            body += data;

            req.on('end', function () {
                var post = qs.parse(body);
                                
                if (chat.api[req.url].rest) {

                    chat.api[req.url].rest(res, body);

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

//Web sockets

io = io(server);

var socketevents = [];

socketevents.push({event : "hello", callback: function () {console.log("hello world"); }});

var socketapi = function (socket) {
 
    socketevents.forEach(function (element, index) {
       
        socket.on(element.event, element.callback);
        
    });
    
};


io.on('connection', function (socket) {
    
    socketapi(socket);
    
    socket.emit("hello", "hello");

});
