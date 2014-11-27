/*jslint node: true */
"use strict";

var exports = {
    messageTypes: [],
    init:
        function () {
            console.log('┎─────> Enabled message types: ' + JSON.stringify(process.config.messagetypes_enabled));
        },
    options: {},
    hook_get_fetch_messagetypes: {
        rank: 0,
        event:
            function (data) {
                data.returns = JSON.stringify(process.config.messagetypes_enabled);
                process.emit('next', data);
            }
    }
};

module.exports = exports;
