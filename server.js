/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var config = require('./config');
var qs = require('querystring');
var io = require('socket.io');
var hook = require('./hook');

//API functions
var chat = {};
chat.api = {};

// Automatically load modules
config.modules_enabled.forEach(function (element, index) {
    chat.api[element.name] = require('./chat_modules/' + element.name);
    chat.api[element.name].options = element.options;
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
                hook('hook_post' + req.url.replace('/','_'), {'url': req.url, 'post': post, 'res': res});
                
                process.on('complete_hook_post' + req.url.replace('/','_'), function (data) {
                    res.end(data.returns);
                });
                
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

var socketUsers = [];
var authenticatedUsers = [];

socketevents.push({event: "authenticate", callback: function(data) { }});

var socketapi = function (socket) {
 
    socketevents.forEach(function (element, index) {
       
        socket.on(element.event, element.callback);
        
    });
    
};


io.on('connection', function (socket) {
    socketapi(socket);
    socket.emit("hello", "hello");

});
