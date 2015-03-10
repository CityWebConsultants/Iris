/*jslint node: true */

"use strict";

var exports = {
    debuglog: function (level, message) {
        console.log(message);
    }
};

process.debuglog = exports.debuglog;

module.exports = exports;
