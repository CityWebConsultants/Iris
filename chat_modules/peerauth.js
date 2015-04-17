/*jslint node: true */

"use strict";

var auth = require('../chat_modules/auth');
var fs = require('fs');
var exports = {
    hook_peer_disconnect: {
        rank: 1,
        event: function (data) {

            var user = auth.userlist[data.id.split("u")[0]];

            if (user) {
                
                user.peer.forEach(function (element, index) {

                    if (element === data.id) {

                        user.peer.splice(index, 1);

                    };

                });
            
            }

            process.emit('next', data);
        }
    },
    // POST /peer
    hook_post_peer: {
        rank: 1,
        event: function (data) {
            if (data.post.userid) {

                var user = auth.userlist[data.post.userid];

                if (user) {

                    //Check if user has a peer connections object. If not create one.

                    if (!user.peer) {

                        user.peer = [];

                    };

                    //Create a unique peerid - userid + date + amount of peer connections already stored for 100% uniqueness. Random number for a bit more security.

                    var peerid = data.post.userid + "u" + user.peer.length + ((Math.random() * 10000).toFixed(0));

                    //Add the peer id to the user account

                    user.peer.push(peerid);

                }

                data.returns = peerid;

                process.emit('next', data);

            } else {
                data.returns = "ERROR: Missing data from request.";
                process.emit('next', data);
            }
        }
    },
    hook_post_peerlist: {
        rank: 1,
        event: function (data) {

            data.post.userlist = data.post.userlist.split("+");

            if (data.post.userlist && data.post.userid) {

                var fetching = data.post.userlist;

                //Loop over all users being fetched

                var peerlist = [];

                fetching.forEach(function (element) {

                    //Check if user exists and has a peer connection listed

                    if (auth.userlist[element] && auth.userlist[element].peer) {

                        auth.userlist[element].peer.forEach(function (element) {

                            peerlist.push(element);

                        });

                    }

                });

                data.returns = JSON.stringify(peerlist);
                process.emit('next', data);

            } else {
                data.returns = "ERROR: Missing data from request.";
                process.emit('next', data);
            }
        }
    }


}
  
var PeerServer = require('peer').PeerServer({
    port: process.config.peerport,
    ssl: {
      key: fs.readFileSync('/var/www/ssl/hub.wlmg.co.uk.key'),
      cert: fs.readFileSync('/var/www/ssl/hub_combined.crt')
    }
});

//Remove peerid after disconnect

PeerServer.on("disconnect", function (id) {

    process.hook('hook_peer_disconnect', {
        id: id
    }, function () {});

});

module.exports = exports;
