/*jslint node: true nomen: true plusplus: true */

"use strict";

var exports = {
    // POST /user/sync
    hook_post_user_sync: {
        rank: 1,
        event: function (data) {
            if (data.post.secretkey && data.post.content) {

                process.hook('hook_secretkey_check', {
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        //Get userid

                        var userid = JSON.parse(data.post.content).uid;

                        process.hook('hook_db_remove', {

                            dbcollection: 'users',
                            dbquery: {
                                'uid': userid
                            }

                        }, function () {

                            process.hook('hook_db_insert', {
                                dbcollection: 'users',
                                dbobject: JSON.parse(data.post.content)
                            }, function (gotData) {

                                data.returns = "Updated";

                                process.emit('next', data);

                            })


                        })

                    } else {
                        process.emit('next', data);
                    }
                });
            }
        }
    },

    hook_user_fetch: {

        rank: 0,
        event: function (data) {
            
            //Gets list of filters
            
            var query = {};

            var filter;

            for (filter in data) {

                query[filter] = data.get[filter];

            }

            process.hook('hook_db_find', {
                dbcollection: 'users',
                dbquery: query
            }, function (gotData) {

                var user = 
                
                data.returns = gotData.returns;
                process.emit('next', data);
            });
        }
    },
};

module.exports = exports;