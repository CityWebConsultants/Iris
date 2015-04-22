/*jslint node: true */

"use strict";

var io = require('socket.io');
var auth = require('../chat_modules/auth');

var socketapi = function (socket) {

    exports.listeners.forEach(function (element, index) {

        var callback;

        (function () {

            callback = function (data) {

                element.callback(data, socket);

            };

        }());

        socket.on(element.event, callback);

    });

};

var exports = {

    listeners: [],
    addlistener: function (listener, callback) {

        exports.listeners.push({
            event: listener,
            callback: callback
        });

    },
    groupBroadcast: function (groupid, messagename, data) {
        process.hook('hook_group_list_users', {
            groupid: groupid
        }, function (users) {
            if (users.returns) {
                users.returns.forEach(function (element, index) {

                    if (auth.userlist[element.userid] && auth.userlist[element.userid].sockets) {
                        auth.userlist[element.userid].sockets.forEach(function (element, index) {
                            element.emit(messagename, data);
                        });
                    }

                });
            }
        });
    },
    userBroadcast: function (userid, messagename, data) {
        if (auth.userlist[userid] && auth.userlist[userid].sockets) {
            auth.userlist[userid].sockets.forEach(function (element, index) {
                element.emit(messagename, data);
            });
        }
    },
    init: function () {

        process.nextTick(function () {

            process.socketio = io(process.server);
            process.socketio.on("connection", function (socket) {

                //Add listeners

                socketapi(socket);

                //Handshake message to trigger a pair callback from client

                socket.emit("handshake", "Connection made");

                socket.on("pair", function (data) {

                    process.hook("hook_auth_check", data, function (check) {

                        if (check.returns) {
                            if (auth.userlist[data.userid]) {
                                // Push socket to userlist

                                // Create if doesn't yet exist
                                if (!auth.userlist[data.userid].sockets) {
                                    auth.userlist[data.userid].sockets = [];
                                }

                                // Check if socket already added
                                var socketAlreadyExists = false;
                                auth.userlist[data.userid].sockets.forEach(function (element, index) {

                                    if (socket.id === element.id) {
                                        socketAlreadyExists = true;
                                    }
                                });

                                if (socketAlreadyExists !== true) {
                                    auth.userlist[data.userid].sockets.push(socket);
                                    socket.userid = data.userid;

                                    var onlineusers = Object.keys(auth.userlist);

                                    process.socketio.sockets.emit('users_online', {
                                        users: onlineusers
                                    });

                                    socket.emit('pair', true);

                                    // Make clients aware that this is the latest socket.
                                    process.userBroadcast(data.userid, 'latest_socket', socket.id);
                                }

                            }
                        } else {
                            socket.emit('pair', false);
                        }

                    });


                });

                socket.on("disconnect", function (reason) {

                    if (socket.userid && auth.userlist[socket.userid] && auth.userlist[socket.userid].sockets) {

                        // for each socket in the userlist registered to this user
                        auth.userlist[socket.userid].sockets.forEach(function (element, index) {
                            if (element === socket) {
                                // remove socket from array if it matches the one that's disconnecting
                                auth.userlist[socket.userid].sockets.splice(index, 1);

                                if (auth.userlist[socket.userid].sockets.length === 0) {

                                    delete auth.userlist[socket.userid];

                                }

                                var onlineusers = Object.keys(auth.userlist);

                                process.socketio.sockets.emit('users_online', {
                                    users: onlineusers
                                });

                            }
                        });

                        try {
                            // Update the latest socket
                            var latestSocket = auth.userlist[socket.userid].sockets[auth.userlist[socket.userid].sockets.length - 1].id;
                            process.userBroadcast(socket.userid, 'latest_socket', latestSocket);
                        } catch (e) {
                            // There wasn't a valid socket available
                        }

                    }

                });

            });

        });

    }
};

process.addSocketListener = exports.addlistener;
process.groupBroadcast = exports.groupBroadcast;
process.userBroadcast = exports.userBroadcast;

module.exports = exports;
