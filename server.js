/*jslint nomen: true, node:true */
"use strict";

var http = require('http');
var config = require('./config');
var qs = require('querystring');
var crypto = require('crypto');
var base64url = require('base64-url');

//API functions

var chat = {};
chat.api = {};

chat.api.login = function (res, post) {
  var authToken;
  crypto.randomBytes(32, function(ex, buf) {
    authToken = base64url.encode(buf);
    res.end("Auth token: " + authToken);
  });
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

}).listen(config.port, config.ip);
