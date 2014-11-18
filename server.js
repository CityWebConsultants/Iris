/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var qs = require('querystring');

//API functions

var chat = {};
chat.api = {};

chat.api.login = function (res, post) {
    
    res.end("Auth token...");
    
};

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
            
            switch (req.url) {
            case "/auth":
                chat.api.login(res, post);
                break;
            default:
                res.end("false request");
            }
            
        });
    });

    //Functions, each get a request argument and paramaters

}).listen(5000, '0.0.0.0');