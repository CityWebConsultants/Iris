/*jslint node: true */
"use strict";

var exports = {
    messageTypes: [],
    init:
        function () {
            // Get available message types
            exports.messageTypes.push('text');
            exports.messageTypes.push('code');
        },
    options: {},
    hook_get_fetch_messagetypes: {
        rank: 0,
        event:
            function (data) {
                data.returns = JSON.stringify(exports.messageTypes);
                process.emit('next', data);
            }
    }
};

module.exports = exports;
