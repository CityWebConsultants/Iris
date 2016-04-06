/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

/**
 * @file Launches Iris with the settings and context of the given site.
 * Launch_site.js is the child process that actually loads and runs the site. It is passed the user sessions
 * and messages from the parent process if the site was restarted or encounted a fatal error.
 */

var parameters = {};

var fs = require("fs");

var config;

process.on("message", function (m) {

  if (m.launchPath) {
    
    process.chdir(m.launchPath);

    var server = require('./boot')(m);

  }

  if (m.sessions) {

    Object.keys(m.sessions).forEach(function (user) {

      iris.modules.auth.globals.userList[user] = m.sessions[user];

    });

  }

  if (m.messages) {

    Object.keys(m.messages).forEach(function (user) {

      iris.messageStore[user] = m.messages[user];

    });

  }

})

/**
 * Handle unhandledRejection.
 */
process.on("unhandledRejection", function (e) {

  if (e.stack) {

    e.stack.forEach(function (error, index) {

      error = "Error on line " + e.stack[index].getLineNumber() + " of " + e.stack[index].getFileName() + " " + e.message;

      console.error(error);

      if (iris.log) {

        iris.log("info", error);

      }

    });


  }

});

/**
 * Handle uncaughtException.
 */
process.on("uncaughtException", function (e) {

  if (Array.isArray(e.stack)) {

    var errorMessage = '';

    e.stack.forEach(function (error, index) {

      errorMessage += "Error on line " + e.stack[index].getLineNumber() + " of " + e.stack[index].getFileName() + " " + e.message + '\n';

    });

    console.error(errorMessage);

    if (iris.log) {

      iris.log("fatal", errorMessage);

    }

  } else {

    console.log(e);

  }

  process.send("restart");

});
