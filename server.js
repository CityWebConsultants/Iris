/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var config = require('./config');
var qs = require('querystring');
var url = require('url');
var io = require('socket.io');

process.hook = require('./hook');

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

    //Check if request is empty
    if (req.headers["content-length"] === "0") {
        res.end("Empty request");
    }
    
    var body = '';
    
    if (req.method === "POST") {
        
        req.on('data', function (data) {
            
            body += data;
            
            req.on('end', function () {
                var requestUrl = url.parse(req.url, true),
                    requestPost = qs.parse(body),
                    hookurl = requestUrl.pathname.split('/').join('_');
                process.hook('hook_post' + hookurl, {'url': req.url, 'post': requestPost, 'res': res});
                
                process.on('complete_hook_post' + hookurl, function (data) {
                    res.end(data.returns);
                });
                
            });
        });
    } else if (req.method === "GET") {
        var requestUrl = url.parse(req.url, true),
            requestGet = qs.parse(requestUrl.query),
            hookurl = requestUrl.pathname.split('/').join('_');

        process.hook('hook_get' + hookurl, {'url': requestUrl.pathname, 'get': requestGet, 'res': res});
        console.log('a:' + 'complete_hook_get' + hookurl);
        process.on('complete_hook_get' + hookurl, function (data) {
            console.log('Complete hook get');
            res.end(data.returns);
        });
        
    } else {
        res.end("Unknown action");
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
