/*jslint nomen: true, node:true */
"use strict";

/*  Configuration file for the chat application
 *
 *  Global values:
 *  - port:             port number to run the web server on                integer
 *  - secretkey:       secret API key to access authentication             string
 *  - modules_enabled:  array of enabled module objects                     array
 *      - name, options{}                                                   string, object
 */

//Get and store command line paramaters

process.paramaters = {};

process.argv.forEach(function (val, index, array) {

    if (val.indexOf("=") !== -1) {
        val = val.split("=");
        process.paramaters[val[0]] = val[1];
    }

});

var config = {
    server: "./server",
    name: "default",
    port: 3000,
    peerport: 3001,
    apikey: 'letmein',
    secretkey: 'letmein',
    admins: [1],
    systemuser: 1,
    modules_enabled: [
        {
            name: 'debug'
        },
        {
            name: 'auth',
            options: {
                token_length: 16,
                allowdebug: true
            }
        },
        {
            name: 'mongodb',
            options: {
                server: 'localhost',
                port: 27017,
                database_name: 'chat-app',
                prefix: ''
            }
        },
        {
            name: 'sockets'
        },
        {
            name: 'group_manager',
            options: {
                allowdebug: true
            }
        },
        {
            name: 'message_add'
        },
        {
            name: 'highlight'
        },
        {
            name: 'message_fetch'
        },
        {
            name: 'message_edit'
        },
        {
            name: 'socket_notifications'
        },
        {
            name: 'activity',
            options: {
                awayCleanupTime: 30000
            }
        },
        {
            name: 'socket_groups'
        },
        {
            name: 'logout'
        },
        {
            name: 'peerauth'
        },
        {
            name: 'mediacall'
        },
        {
            name: 'user_sync'
        },
        {
            name: 'group_sync'
        },
        {
            name: 'typing'
        }
    ]
};

var server = require(config.server)(config, process.paramaters);