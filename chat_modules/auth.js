var crypto = require('crypto');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Auth = {
    // A side effect of declaring this object is that you can have default options!
    options: {token_length: 4},
    rest:
        function (res, post) {
            var self = this;
            var authToken;
            crypto.randomBytes(exports.options.token_length, function (ex, buf) {
                authToken = buf.toString('hex');
                res.end(authToken);
                
                // Send new authenticated user event
                console.log('emitting event');
                self.emit('authuser', post.uid, authToken);
                
                console.log(authToken);
            });
        }
};

console.log(EventEmitter);

// Enable events to be accessed globally by adding .on property.
util.inherits(Auth.rest, EventEmitter);
module.exports = Auth;
