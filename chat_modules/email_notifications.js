/*jslint node: true */

"use strict";

var http = require('http');

var options = {
    host: process.config.sendemailto,
    path: '/email',
    method: 'POST'
};

var email = function (content) {

    if (Object.keys(content.returns).length > 0) {

        var email = {
         
            address:content.email,
            content: content.returns
            
        }
        
        var req = http.request(options);
        req.write(JSON.stringify(email));
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

//30 min notifications

setInterval(function () {

    fetchnotifications(1800000);

}, 1800000);

//Daily notifications

setInterval(function () {

    fetchnotifications(86400000);

}, 86400000);

module.exports = exports;