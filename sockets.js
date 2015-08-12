/*jslint node: true */

"use strict";

var io = require('socket.io');

//Function for registering socket events

C.socketListeners = {};

// Loop over all installed node.js modules and check if hook is present

C.socketServer = io(C.server);

C.socketServer.on("connection", function (socket) {

  //Register pair listener

  socket.on("pair", function (credentials) {

    CM.auth.globals.credentialsToPass(credentials).then(function (authPass) {

      //Paired

      //Check if a user object exists

      socket.user = CM.auth.globals.userList[authPass.userid];

      socket.authPass = authPass;

      if (socket.user) {

        if (!socket.user.sockets) {

          socket.user.sockets = {};

        }

        CM.auth.globals.userList[authPass.userid].sockets[socket.id] = socket;

      };

      socket.emit("pair", authPass);

    }, function (error) {

      socket.emit("error", error);

    });

  });

  socket.on("disconnect", function (reason) {

    if (socket.user) {

      //Remove socket

      delete socket.user.sockets[socket.id]

    }

  });

  //Register all custom listeners from modules

  Object.keys(C.socketListeners).forEach(function (event, index) {

    C.socketListeners[event].forEach(function (trigger) {

      var callback = function (data) {

        trigger(socket, data);

      };

      socket.on(event, callback);

    });

  });

});
