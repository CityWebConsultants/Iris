/*jslint nomen: true, node:true */
"use strict";

//Takes a config file

module.exports = function (config, paramaters) {

    var http = require('http');
    var qs = require('querystring');
    var url = require('url');
    var path = require('path');
    var fs = require('fs');

    var version = 'RC1';
    console.log("Running Chat App version " + version);
    console.log("Name: " + config.name)
    console.log("HTTP port: " + config.port);
    console.log("Peer port: " + config.peerport);
    if(Object.keys(paramaters).length > 0){
    console.log("Command line arguments: ");
    console.log(paramaters);
    }
    
    // Current globals
    process.hook = require('./hook');

    process.config = config;

    //API functions
    var chat = {};
    chat.api = {};

    // Automatically load modules
    process.config.modules_enabled.forEach(function (element, index) {
        chat.api[element.name] = require('./chat_modules/' + element.name);
        chat.api[element.name].options = element.options;
        if (chat.api[element.name].init) {
            chat.api[element.name].init();
        }
        console.log("[OK] " + element.name + " module enabled");
    });

    //Server and request function router

    process.server = http.createServer(function (req, res) {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*'
        });



        var body = '';

        if (req.method === "POST") {
            //Check if request is empty
            if (req.headers["content-length"] === "0") {
                res.writeHead(400);
                res.end("Empty request");
            }

            req.on('data', function (data) {

                body += data;

                req.on('end', function () {
                    var requestUrl = url.parse(req.url, true),
                        requestPost = qs.parse(body),
                        hookurl = requestUrl.pathname.split('/').join('_');
                    process.hook('hook_post' + hookurl, {
                        'url': req.url,
                        'post': requestPost,
                        'res': res
                    });

                    process.on('complete_hook_post' + hookurl, function (data) {
                        res.end(data.returns);
                    });

                });
            });
        } else if (req.method === "GET") {
            var requestUrl = url.parse(req.url, true),
                requestGet = requestUrl.query,
                hookurl = requestUrl.pathname.split('/').join('_');

            process.hook('hook_get' + hookurl, {
                'url': requestUrl.pathname,
                'get': requestGet,
                'res': res
            });

            process.on('complete_hook_get' + hookurl, function (data) {

                //Catch empty hooks

                if (!data) {

                    var staticpath = __dirname + path.normalize("/static/" + url.parse(req.url).pathname);

                    //Add HTML to path if extension is empty

                    if (!path.extname(staticpath)) {

                        staticpath += ".html";

                    }

                    fs.exists(staticpath, function (exists) {
                        if (exists) {

                            fs.readFile(staticpath, function read(err, data) {

                                var extension = path.extname(staticpath).replace(".", ""),
                                    type = "text/plain";

                                switch (extension) {
                                case "html":
                                    type = "text/html";
                                    break;
                                case "js":
                                    type = "text/javascript";
                                    break;
                                case "css":
                                    type = "text/css";
                                    break;
                                default:
                                    type = "text/plain";
                                }

                                res.writeHead(200, {
                                    'Content-Type': type
                                });
                                res.end(data);

                            });


                        } else {
                            res.writeHead(404);
                            res.end("404");

                        }
                    });

                } else {

                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    res.writeHead(200, {
                        'Access-Control-Allow-Origin': '*'
                    });
                    res.write(data.returns);
                    res.end();

                }
            });

        } else {
            res.writeHead(400);
            res.end("Unknown action");
        }

        //Functions, each get a request argument and paramaters

    }).listen(process.config.port);

};