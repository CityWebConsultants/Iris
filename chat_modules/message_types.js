/*jslint node: true */
"use strict";

/*  Message Types Module
 *  Provides an API endpoint for discovering available messagetypes.
 *
 *  Provides /fetch/messagetypes
 */

var exports = {
    messageTypes: [],
    init:
        function () {
            console.log('    ┎─────> Enabled message types: ' + JSON.stringify(process.config.messagetypes_enabled));
        },
    options: {},
    // GET /fetch/messagetypes
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
