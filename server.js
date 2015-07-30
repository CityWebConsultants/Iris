/*jslint nomen: true, node:true */
"use strict";

var net = require('net');
var repl = require('repl');

module.exports = function (config, paramaters) {

  var version = 'RC1',
    chat = {
      api: {}
    },
    http = require('http'),
    qs = require('querystring'),
    url = require('url'),
    path = require('path'),
    fs = require('fs');

  console.log("\nLaunching Chat App " + version + "\n");
  console.log("Name: " + config.name);
  console.log("Hypertext port: " + config.port);
  console.log("Peer port: " + config.peerport);

  if (config.telnetport) {

    console.log("Telnet port: " + config.telnetport);

    var cli = net.createServer(function (telnet) {
      telnet.on('exit', function () {
        telnet.end();
      });

      repl.start({
        prompt: "Chat> ",
        input: telnet,
        output: telnet,
        terminal: true
      });

    });

    cli.listen(config.telnetport);

  }

  if (Object.keys(paramaters).length > 0) {
    console.log("Command line arguments: ");
    console.log(paramaters);
  }

  //Connect to database

  global.mongoose = require('mongoose');
  mongoose.connect('mongodb://' + config.db_server + ':' + config.db_port + '/' + config.db_name);

  var db = mongoose.connection;

  //Wait until database is open

  db.on('error', function (error) {

    console.log(error);

  });

  //Check database is loaded

  db.once('open', function () {

    console.log("Database running");

    // Current globals
    global.hook = require('./hook');
    require('./promises');

    process.config = config;

    // Global functions as defined in modules
    global.C = {};

    console.log("\nEnabled modules:\n");

    C.schemas = {};

    // Automatically load modules
    process.config.modules_enabled.forEach(function (element, index) {
      chat.api[element.name] = require('./chat_modules/' + element.name);
      chat.api[element.name].options = element.options;

      if (chat.api[element.name].init) {

        chat.api[element.name].init();

      }

      if (chat.api[element.name].globals) {

        C[element.name] = {};

        var globals = chat.api[element.name].globals;

        Object.keys(globals).forEach(function (global) {
          C[element.name][global] = globals[global];
        });

      }

      if (chat.api[element.name].schemas) {

        C.schemas[element.name] = {};

        var moduleSchemas = chat.api[element.name].schemas;
        
        Object.keys(moduleSchemas).forEach(function (schema) {
          C.schemas[element.name][schema] = moduleSchemas[schema];
        });

      }

      console.log(element.name);
      
    });

    // Run update hook

    hook('hook_update', {}, function (data) {
      console.log("\nAny update scripts present will now run.\n");
    });

    //Server and request function router

    var serverhandler = function (req, res) {

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

            hook('hook_post' + hookurl, {
              'url': req.url,
              'post': requestPost,
              'res': res,
              'auth': C.auth.getPermissionsLevel(requestPost)
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

        hook('hook_' + req.method.toLowerCase() + hookurl, {
          'url': requestUrl.pathname,
          'get': requestGet,
          'res': res,
          'auth': C.auth.getPermissionsLevel(requestGet)
        }, function (data) {

          data.res.writeHead(200, {
            'Content-Type': 'application/json'
          });
          data.res.writeHead(200, {
            'Access-Control-Allow-Origin': '*'
          });

          data.res.write(data.returns);

          data.res.end();

        });

      } else {
        res.writeHead(400);
        res.end("Unknown action");
      }

      //Functions, each get a request argument and paramaters

    };

    if (process.config.https) {

      var https = require('https');

      var tls_options = {
        key: fs.readFileSync(process.config.https_key),
        cert: fs.readFileSync(process.config.https_cert)
      };

      process.server = https.createServer(tls_options, serverhandler);

      process.server.listen(process.config.port);

    } else {

      process.server = http.createServer(serverhandler);

      process.server.listen(process.config.port);

    }

  });

};
