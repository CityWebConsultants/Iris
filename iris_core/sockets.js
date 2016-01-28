/*jslint node: true */

"use strict";

/**
 * @file Socket.io server setup and management functions
 */

var io = require('socket.io');

//Function for registering socket events

iris.socketListeners = {};

// Loop over all installed node.js modules and check if hook is present

iris.socketServer = io(iris.server);

/**
 * Sends a socket message to any specified users
 *
 * @param {string[]} userids - Array of userids. If it contains '*', the message is sent to all users.
 * @param {string} message - Socket event name on which the message will be sent.
 * @param data - Any variable to be sent as a message.
 */
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

/**
 * Authentication of a user via sockets
 *
 * @param {string} userid - The userid of the authenticating user.
 * @param {string} token - The session token that the authenticating user should possess.
 * @param {object} socket - The socket object being used for the request.
 */
iris.socketLogin = function (userid, token, socket) {

  //Paired

  iris.modules.auth.globals.credentialsToPass({
    userid: userid,
    token: token
  }).then(function (authPass) {

    //Check if a user object exists

    socket.user = iris.modules.auth.globals.userList[userid];

    socket.authPass = authPass;

    if (socket.user) {

      if (!socket.user.sockets) {

        socket.user.sockets = {};

      }

      iris.modules.auth.globals.userList[userid].sockets[socket.id] = {
        socket: socket,
        timestamp: Date.now()
      };

    };

    socket.emit("pair", true);

  }, function (fail) {

    iris.log("error", fail);

  });

}

iris.socketServer.on("connection", function (socket) {

  if (!iris.status.ready) {

    socket.emit("Error", "Starting up");
    return false;

  }

  // Run socket through connection hook for things like getting user data from cookies

  iris.hook("hook_socket_connect", "root", {
    socket: socket
  }, null).then(function () {


  }, function (fail) {

    if (fail !== "No such hook exists") {

      iris.log("error", fail);

    }

  });

  //Register pair listener

  socket.on("pair", function (credentials) {

    // Pairing for non cookie based login

    iris.socketLogin(credentials.userid, credentials.token, socket);

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
