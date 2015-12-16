/*jslint node: true */

"use strict";

var io = require('socket.io');

//Function for registering socket events

iris.socketListeners = {};

// Loop over all installed node.js modules and check if hook is present

iris.socketServer = io(iris.server);

iris.sendSocketMessage = function (userids, message, data) {

  if (userids.indexOf("*") !== -1) {

    iris.socketServer.emit(message, data);
    return false;

  }

  userids.forEach(function (userid) {

    var user = iris.modules.auth.globals.userList[userid];

    if (user && user.sockets) {
      Object.keys(user.sockets).forEach(function (socket) {

        user.sockets[socket].socket.emit(message, data);

      })

    }

  });

};

iris.socketServer.on("connection", function (socket) {

  if (!iris.status.ready) {

    socket.emit("Error", "Starting up");
    return false;

  }

  //Register pair listener

  socket.on("pair", function (credentials) {

    iris.modules.auth.globals.credentialsToPass(credentials).then(function (authPass) {

      //Paired

      //Check if a user object exists

      socket.user = iris.modules.auth.globals.userList[authPass.userid];

      socket.authPass = authPass;

      if (socket.user) {

        if (!socket.user.sockets) {

          socket.user.sockets = {};

        }

        iris.modules.auth.globals.userList[authPass.userid].sockets[socket.id] = {
          socket: socket,
          timestamp: Date.now()
        };

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

    //Run hook for disconnected socket

    iris.hook("hook_socket_disconnected", socket.authPass, null, Date.now())

  });

  //Register all custom listeners from modules

  Object.keys(iris.socketListeners).forEach(function (event, index) {

    iris.socketListeners[event].forEach(function (trigger) {

      var callback = function (data) {

        trigger(socket, data);

      };

      socket.on(event, callback);

    });

  });

});
