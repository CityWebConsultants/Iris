/*jslint node: true */

"use strict";

var http = require('http');
var querystring = require('querystring');

var email = function (content) {

    if (Object.keys(content.returns).length > 0) {

        content.returns.email = content.email;
        
        var data = JSON.stringify(content.returns);

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

                    userid: "1",
                    secretkey: process.config.secretkey,
                    apikey: process.config.apikey,
                    messages: 'true',
                    date: new Date(),
                    types: [],
                    email: process.usercache[user].email

                };

                data.date.setMinutes(data.date.getMinutes() - time);

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

setTimeout(function () {

    fetchnotifications(1800000);

}, 500);

//30 min notifications

setInterval(function () {

    fetchnotifications(1800000);

}, 1800000);

//Daily notifications

setInterval(function () {

    fetchnotifications(86400000);

}, 86400000);

module.exports = exports;