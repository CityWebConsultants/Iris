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

                        process.hook('hook_db_update', {
                            dbcollection: 'users',
                            dbquery: {
                                uid: userid
                            },
                            dbupdate: JSON.parse(data.post.content),
                            dbupsert: true
                        }, function (gotData) {

                            data.returns = "Updated";

                            process.emit('next', data);

                        })



                    } else {
                        process.emit('next', data);
                    }
                });
            }
        }
    },

    hook_get_usersearch: {

        rank: 0,
        event: function (data) {

            //Gets list of filters

            var name = data.get.name;

            name = name.split(" ");

            var query = [];

            var and1 = [];
            var and2 = [];

            and1.push({
                'field_name_last': {
                    $regex: new RegExp('^' + name[0], "i")
                }
            });
            and1.push({
                'field_name_first': {
                    $regex: new RegExp('^' + name[0], "i")
                }
            });
            and2.push({
                'field_name_last': {
                    $regex: new RegExp('^' + name[1], "i")
                }
            });
            and2.push({
                'field_name_first': {
                    $regex: new RegExp('^' + name[1], "i")
                }
            });

            query.push({
                $or: and1
            });

            if (name[1]) {

                query.push({
                    $or: and2
                });

            }

            query = {
                $and: query
            };

            process.hook('hook_db_find', {
                dbcollection: 'users',
                dbquery: query
            }, function (gotData) {

                var userlist = [];

                JSON.parse(gotData.returns).forEach(function (element) {

                    var uid = element.uid;
                    var name = element.field_name_first + " " + element.field_name_last;

                    userlist.push({
                        uid: uid,
                        name: name
                    });


                });

                data.returns = JSON.stringify(userlist);
                process.emit('next', data);
            });
        }
    },
    hook_get_userfetch: {

        rank: 0,
        event: function (data) {

            //Split data by commas

            if (data.get.users) {

                var query = {};

                var users = JSON.parse(data.get.users);

                users.forEach(function (element, index) {

                    users[index] = element.toString();

                });

                query["uid"] = {
                    $in: users
                };

                process.hook('hook_db_find', {
                    dbcollection: 'users',
                    dbquery: query
                }, function (gotData) {

                    var userlist = gotData.returns;

                    var output = [];

                    JSON.parse(userlist).forEach(function (element) {

                        var name = element.field_name_first + " " + element.field_name_last;

                        output.push({
                            uid: element.uid,
                            username: name
                        });

                    });

                    data.returns = JSON.stringify(output);
                    process.emit("next", data);

                });

            } else {

                data.returns = "Error";
                process.emit("next", data);

            };

        }



    }
};

module.exports = exports;