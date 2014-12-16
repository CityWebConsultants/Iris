/*jslint nomen: true, node:true */
"use strict";

//Get and store command line paramaters

process.paramaters = {};

process.argv.forEach(function (val, index, array) {

    if (val.indexOf("=") !== -1) {
        val = val.split("=");
        process.paramaters[val[0]] = val[1];
    }
    
});

console.log(process.paramaters);

var http = require('http');
var qs = require('querystring');
var url = require('url');
var path = require('path');
var fs = require('fs');

var version = 'alpha1';
console.log("Chat app " + version);

// Current globals
process.hook = require('./hook');

//Read config file from command line paramaters (for multisites) or use default config file if no paramater is passed through

if (process.paramaters.config) {

    process.config = require('./' + process.paramaters.config);

} else {
    
    process.config = require('./config');
    
}

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
                process.hook('hook_post' + hookurl, {'url': req.url, 'post': requestPost, 'res': res});
                
                process.on('complete_hook_post' + hookurl, function (data) {
                    res.end(data.returns);
                });
                
            });
        });
    } else if (req.method === "GET") {
        var requestUrl = url.parse(req.url, true),
            requestGet = requestUrl.query,
            hookurl = requestUrl.pathname.split('/').join('_');
        
        process.hook('hook_get' + hookurl, {'url': requestUrl.pathname, 'get': requestGet, 'res': res});

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
                            
                            res.writeHead(200, { 'Content-Type': type });
                            res.end(data);
                            
                        });

                        
                    } else {
                        res.writeHead(404);
                        res.end("404");
                        
                    }
                });
            
            } else {

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
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
