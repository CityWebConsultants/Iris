/*jslint node: true */
"use strict";

/*  Highlight Module
 *  A module wrapper for highlight.js
 *
 *  Provides hook_highlight
 *      - accepts {code: <STRING: CODE TO HIGHLIGHT>}
 */

var hl = require('highlight').Highlight;

var exports = {
    options: {},
    hook_highlight: {
        rank: 0,
        event: function (data) {
            data.returns = hl(data.code);
            process.emit('next', data);
        }
    },
    // POST /debug/hl
    hook_post_debug_hl: {
        rank: 0,
        event: function (data) {
            data.code = data.post.code;

            process.hook("hook_highlight", {code: data.code}, function (gotData) {
                data.returns = gotData.returns;
                process.emit('next', data);
            });
        }
    },
    hook_message_process: {
        rank: 0,
        event: function (data) {
            if (data.content && data.content.code) {
                process.hook("hook_highlight", {code: data.content.code}, function (gotData) {
                    data.content.code = gotData.returns;
                    process.emit('next', data);
                });
            } else {
                process.emit('next', data);
            }
        }
    }
};

module.exports = exports;
