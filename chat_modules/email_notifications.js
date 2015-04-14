/*jslint node: true */

"use strict";

var http = require('http');
var querystring = require('querystring');

var email = function (content) {

    if (Object.keys(content.returns).length > 0) {

        var notifications = [];

        //Loop over groups in the unread message array

        var group

        var output = {
            email: content.email,
            groups: []
        };

        for (group in content.returns) {

            var groupmessages = {};

            var group = content.returns[group];

            groupmessages.groupname = group.details.name;
            
            if (group.details.name === "default") {
                
                groupmessages.groupname = process.defaultname(group.members, content.userid);
                
            }

            groupmessages.messages = [];

            group.messages.forEach(function (element, index) {

                var author = process.usercache[element.userid];

                var type;

                for (type in element.content) {

                    var content = element.content[type];

                };

                groupmessages.messages.push({

                    //Only send relevant author information

                    author: {

                        username: author.username,
                        avatar: author.avatar,
                        uid: author.uid,
                        email: author.email

                    },

                    content: content

                })

            });

            output.groups.push(groupmessages);

        };

        var data = JSON.stringify(output);

        var options = {
            host: process.config.sendemailto,
            path: '/email',
            method: 'POST',
            headers: {
                'Content-Length': Buffer.byteLength(data)
            }
        };

        var callback = function (response) {

            var str = '';

            response.on('data', function (chunk) {
                str += chunk;
            });

            response.on('end', function () {

                console.log(str);

            });

        };

        var req = http.request(options, callback);
        req.write(data);
        req.end();

    }

};

//Send email notifications to people subscribed to them every 30 minutes

var fetchnotifications = function (time) {

    var user;

    for (user in process.usercache) {

        var notifications = process.usercache[user].notifications;

        if (notifications) {

            //Check if user is not online

            if (!process.userlist[process.usercache[user].uid]) {

                var data = {

                    userid: user,
                    secretkey: process.config.secretkey,
                    apikey: process.config.apikey,
                    messages: 'true',
                    date: new Date(),
                    types: [],
                    email: process.usercache[user].email

                };


                var type;

                for (type in notifications) {

                    if (notifications[type].toString() === time.toString()) {

                        data.types.push(type);

                    }

                }

                process.hook("hook_unread", data, email);

            }

        }

    }

};

//30 min notifications

setInterval(function () {

    fetchnotifications(1800000);

}, 1800000);

//Daily notifications

setInterval(function () {

    fetchnotifications(86400000);

}, 86400000);

module.exports = exports;