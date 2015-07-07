/*jslint node: true */

"use strict";

var auth = require('../chat_modules/auth');

var calls = {};

var hangup = function (userid, mediacallid) {

    var groupid = mediacallid.split("g")[0];

    var userindex = calls[mediacallid].members.indexOf(userid);
    calls[mediacallid].members.splice(userindex, 1);

    process.groupBroadcast(groupid, 'mediacallhungup', {userid: userid, mediacallid: mediacallid, members: calls[mediacallid].members});

    if (calls[mediacallid].members.length < 2) {
        hook('hook_message_add', {
            userid: process.config.systemuser,
            groupid: groupid,
            content: {
                'mediacall': {action: 'end', timestamp: Date.now() - calls[mediacallid].started}
            },
            strong_auth_check: false
        }, function () {});

        delete calls[mediacallid];
    }

};

var exports = {

    init: function () {

        process.nextTick(function () {

            process.addSocketListener("mediacallstart", function (data, socket) {
                // takes userid, token, groupid
                // sends to all members notification of call starting

                hook('hook_auth_check', {
                    userid: data.userid,
                    token: data.token
                }, function (authcheck) {
                    if (authcheck.returns === true) {
                        //todo - check if they're in the group

                        var mediacallid = data.groupid + 'g' + Date.now() + (Math.random() * 10000).toFixed(0);

                        calls[mediacallid] = {
                            id: mediacallid,
                            started: Date.now(),
                            members: [data.userid]
                        };

                        process.groupBroadcast(data.groupid, 'mediacallstart', calls[mediacallid]);

                        var heartbeat = setInterval(function () {

                            if (calls[mediacallid]) {

                                process.groupBroadcast(data.groupid, 'mediacallheartbeat', calls[mediacallid]);

                            } else {

                                clearInterval(heartbeat);

                            }

                        }, 2000);

                    } else {
                        // return error
                    }
                });
            });

            process.addSocketListener("mediacallhangup", function (data, socket) {
                // takes userid, token, callid
                // end call if less than 2 members

                if (data.userid && data.token && data.mediacallid) {
                    hook('hook_auth_check', {
                        userid: data.userid,
                        token: data.token
                    }, function (authcheck) {
                        if (authcheck.returns === true) {

                            if (calls[data.mediacallid]) {

                                hangup(data.userid, data.mediacallid);

                            }

                        } else {
                            // return error
                        }
                    });
                } else {
                    // return error
                }
            });

            process.addSocketListener("mediacallaccept", function (data, socket) {
                // takes userid, token, callid
                // returns array of active members in call
                // sends to others the userid of caller

                if (data.userid && data.token && data.mediacallid) {
                    hook('hook_auth_check', {
                        userid: data.userid,
                        token: data.token
                    }, function (authcheck) {
                        if (authcheck.returns === true) {
                          
                            if (calls[data.mediacallid]) {

                                if (calls[data.mediacallid].members.indexOf(data.userid) === -1) {
                                  
                                    calls[data.mediacallid].members.push(data.userid);
                                    process.userBroadcast(data.userid, 'mediacallinit', {call:calls[data.mediacallid], voice:data.voice, video:data.video});

                                }

                            }

                        } else {
                            // return error
                        }
                    });
                } else {
                    // return error
                }

            });


        });
    },
    hook_peer_disconnect: {
        rank: 1,
        event: function (data) {

            var user = data.id.split("u")[0];

            for (var call in calls) {
                calls[call].members.forEach(function (element) {
                    if (element === user) {
                        hangup(user, calls[call].id);
                    }
                });
            }

            process.emit('next', data);
        }
    },
}

module.exports = exports;
