/*jslint node: true */

"use strict";

//var auth = require('../chat_modules/auth');

var calls = {};

var exports = {
    init: function () {

        process.nextTick(function () {

            process.addSocketListener("mediacallstart", function (data, socket) {
                // takes userid, token, groupid
                // sends to all members notification of call starting

                process.hook('hook_auth_check', {
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

                                process.groupBroadcast(data.groupid, 'mediacallheartbeat', calls[mediacallid])

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
                    process.hook('hook_auth_check', {
                        userid: data.userid,
                        token: data.token
                    }, function (authcheck) {
                        if (authcheck.returns === true) {

                            if (calls[data.mediacallid]) {

                                var userindex = calls[data.mediacallid].members.indexOf(data.userid);
                                calls[data.mediacallid].members.splice(userindex, 1);

                                if (calls[data.mediacallid].members.length < 2) {
//                                    process.groupBroadcast(data.groupid, 'mediacallend', data.mediacallid);
                                    delete calls[data.mediacallid];
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

            process.addSocketListener("mediacallaccept", function (data, socket) {
                // takes userid, token, callid
                // returns array of active members in call
                // sends to others the userid of caller

                if (data.userid && data.token && data.mediacallid) {
                    process.hook('hook_auth_check', {
                        userid: data.userid,
                        token: data.token
                    }, function (authcheck) {
                        if (authcheck.returns === true) {

                            if (calls[data.mediacallid]) {

                                if (calls[data.mediacallid].members.indexOf(data.userid) === -1) {

                                    calls[data.mediacallid].members.push(data.userid);
                                    process.userBroadcast(data.userid, 'mediacallinit', calls[data.mediacallid]);

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
    }
}

module.exports = exports;
