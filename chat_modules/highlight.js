/* jslint: node: true */
"use strict";

var hl = require('highlight').Highlight;

var exports = {
    options: {},
    hook_highlight: {
        rank: 0,
        event: function (data) {
            console.log(data.pid);
            data.returns = hl(data.code);
            process.emit("next", data);
        }
    },
    hook_post_debug_hl: {
        rank: 0,
        event: function (data) {
            data.code = data.post.code;

            process.hook("hook_highlight", {code: data.code}, function (gotCode) {
                console.log(gotCode.returns);
                data.returns = gotCode.returns;

            });

            console.log(data.pid);
            process.emit("next", data);
        }
    }
};

module.exports = exports;
