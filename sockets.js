/*jslint node: true */

"use strict";

var io = require('socket.io');

C.socketServer = io(C.server);

C.socketServer.on("connection", function (socket) {

  //Register pair listener

  socket.on("pair", function (credentials) {

    CM.auth.globals.credentialsToPass(credentials).then(function (authPass) {

      //Paired

      //Check if a user object exists

      socket.user = CM.auth.globals.userList[authPass.userid];

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

});


//var socketapi = function (socket) {
//
//  exports.listeners.forEach(function (element, index) {
//
//    var callback;
//
//    (function () {
//
//      callback = function (data) {
//
//        element.callback(data, socket);
//
//      };
//
//    }());
//
//    socket.on(element.event, callback);
//
//  });
//
//};
//
//var exports = {
//
//  listeners: [],
//  addlistener: function (listener, callback) {
//
//    exports.listeners.push({
//      event: listener,
//      callback: callback
//    });
//
//  },
//  groupBroadcast: function (groupid, messagename, data) {
//    hook('hook_group_list_users', {
//      groupid: groupid
//    }, function (users) {
//      if (users.returns) {
//        users.returns.forEach(function (element, index) {
//
//          if (auth.userlist[element.userid] && auth.userlist[element.userid].sockets) {
//            auth.userlist[element.userid].sockets.forEach(function (element, index) {
//              element.emit(messagename, data);
//            });
//          }
//
//        });
//      }
//    });
//  },
//  userBroadcast: function (userid, messagename, data) {
//    if (auth.userlist[userid] && auth.userlist[userid].sockets) {
//      auth.userlist[userid].sockets.forEach(function (element, index) {
//        element.emit(messagename, data);
//      });
//    }
//  },
//  publicBroadcast: function (name, data) {
//    process.socketio.emit(name, data);
//  },
//  updateLatestSocket: function (userid) {
//    try {
//      // Update the latest socket
//      var latestSocket = auth.userlist[userid].sockets[auth.userlist[userid].sockets.length - 1].id;
//      process.userBroadcast(userid, 'latest_socket', latestSocket);
//    } catch (e) {
//      // There wasn't a valid socket available
//    }
//  },
//  init: function () {
//
//    //Global array of online users
//
//    process.onlineUsers = [];
//
//    process.userTimeouts = {};
//
//    process.nextTick(function () {
//
//      process.socketio = io(process.server);
//      process.socketio.on("connection", function (socket) {
//
//        //Send online users array if it exists
//
//        process.publicBroadcast('users_online', {
//          users: process.onlineUsers
//        });
//
//        //Add listeners
//
//        socketapi(socket);
//
//        //Handshake message to trigger a pair callback from client
//
//        socket.emit("handshake", "Connection made");
//
//        socket.on("pair", function (data) {
//
//          hook("hook_auth_check", data, function (check) {
//
//            if (check.returns) {
//              if (auth.userlist[data.userid]) {
//                // Push socket to userlist
//
//                // Create if doesn't yet exist
//                if (!auth.userlist[data.userid].sockets) {
//                  auth.userlist[data.userid].sockets = [];
//                }
//
//                // Check if socket already added
//                var socketAlreadyExists = false;
//                auth.userlist[data.userid].sockets.forEach(function (element, index) {
//
//                  if (socket.id === element.id) {
//                    socketAlreadyExists = true;
//                  }
//                });
//
//                if (socketAlreadyExists !== true) {
//                  auth.userlist[data.userid].sockets.push(socket);
//                  socket.userid = data.userid;
//
//                  //Loop over online users, find the relevant uid entry and replace it with a new one, also clearing the timeout
//
//                  process.onlineUsers.forEach(function (element, index) {
//
//
//                    if (element.uid === socket.userid) {
//
//                      //Clear timeout if present
//
//                      clearTimeout(process.userTimeouts[element.uid]);
//
//                      process.onlineUsers.splice(index, 1);
//
//                    }
//
//
//                  });
//
//                  //Add user entry from usercache
//
//                  process.onlineUsers.push({
//
//                    uid: socket.userid,
//                    username: process.usercache[socket.userid].username,
//                    avatar: process.usercache[socket.userid].avatar,
//                    picture: process.usercache[socket.userid].picture,
//                    status: "online"
//
//                  });
//
//                  process.publicBroadcast('users_online', {
//                    users: process.onlineUsers
//                  });
//
//                  socket.emit('pair', true);
//
//                  // Make clients aware that this is the latest socket.
//                  process.userBroadcast(data.userid, 'latest_socket', socket.id);
//                }
//
//              }
//            } else {
//              socket.emit('pair', false);
//            }
//
//          });
//
//
//        });
//
//        socket.on("disconnect", function (reason) {
//
//          if (socket.userid && auth.userlist[socket.userid] && auth.userlist[socket.userid].sockets) {
//            console.log(socket.userid + ' disconnected.');
//            // for each socket in the userlist registered to this user
//            auth.userlist[socket.userid].sockets.forEach(function (element, index) {
//              if (element === socket) {
//                // remove socket from array if it matches the one that's disconnecting
//                auth.userlist[socket.userid].sockets.splice(index, 1);
//
//                if (auth.userlist[socket.userid].sockets.length === 0) {
//
//                  delete auth.userlist[socket.userid];
//
//                  process.onlineUsers.forEach(function (element, index) {
//
//                    if (element.uid === socket.userid) {
//
//                      process.onlineUsers[index].status = "away";
//
//                      process.userTimeouts[element.uid] = setTimeout(function () {
//
//                        process.onlineUsers.forEach(function (user, userIndex) {
//                          if (user.uid === element.uid) {
//                            process.onlineUsers.splice(userIndex, 1);
//                          }
//                        });
//
//                        process.socketio.sockets.emit('users_online', {
//                          users: process.onlineUsers
//                        });
//
//                      }, exports.options.awayTimeout);
//
//                    }
//
//                  });
//
//                }
//
//                process.publicBroadcast('users_online', {
//                  users: process.onlineUsers
//                });
//
//              }
//            });
//
//            process.updateLatestSocket(socket.userid);
//
//          }
//
//        });
//
//      });
//
//    });
//
//  }
//};
//
//process.addSocketListener = exports.addlistener;
//process.groupBroadcast = exports.groupBroadcast;
//process.publicBroadcast = exports.publicBroadcast;
//process.userBroadcast = exports.userBroadcast;
//process.updateLatestSocket = exports.updateLatestSocket;
//
//module.exports = exports;
