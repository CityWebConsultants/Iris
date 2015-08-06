/*jslint node: true nomen: true plusplus: true */

"use strict";

var exports = {
    hook_mongodb_ready: {
        rank: 1,
        event: function () {

            hook('hook_usercache', {}, function (data) {


            });

        }
    },
    // POST /user/sync
    hook_post_user_sync: {
        rank: 1,
        event: function (data) {
            if (data.post.apikey && data.post.secretkey && data.post.content) {
                hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        //Get userid

                        var userid = JSON.parse(data.post.content).uid;

                        hook('hook_db_update', {
                            dbcollection: 'users',
                            dbquery: {
                                uid: userid
                            },
                            dbupdate: JSON.parse(data.post.content),
                            dbupsert: true
                        }, function (gotData) {

                            data.returns = "Updated";

                            hook('hook_usercache', {}, function (data) {


                            });

                            process.emit('next', data);

                        });



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

            hook('hook_db_find', {
                dbcollection: 'users',
                dbquery: query
            }, function (gotData) {

                var userlist = [];

                JSON.parse(gotData.returns).forEach(function (element) {

                    var uid = element.uid;
                    var picture;
                    if (element.picture) {
                        picture = element.picture;
                    }
                    var avatar;
                    if (element.avatar) {
                        avatar = element.avatar;
                    }

                    var name = element.field_name_first + " " + element.field_name_last;

                    userlist.push({
                        uid: uid,
                        name: name,
                        picture: picture,
                        avatar: avatar
                    });


                });

                data.returns = JSON.stringify(userlist);
                process.emit('next', data);
            });
        }
    },
    hook_usercache: {

        rank: 1,
        event: function (data) {

            //Split data by commas

            hook('hook_db_find', {
                dbcollection: 'users',
                dbquery: {}
            }, function (gotData) {

                var userlist = gotData.returns;

                var output = {};

                JSON.parse(userlist).forEach(function (element) {

                    var name = '';

                    if (element.field_name_first) {

                        name = element.field_name_first + " " + element.field_name_last;

                    } else {

                        name = element.uid;

                    }

                    //Change admin name

                    if (parseInt(element.uid, 10) === 1) {

                        name = process.config.admin_name;

                    }

                    output[element.uid] = {
                        uid: element.uid,
                        username: name,
                        picture: element.picture,
                        avatar: element.avatar,
                        email: element.mail,
                        notifications: element.notification_settings,
                    };

                });

                process.usercache = output;

                process.emit('next', data);

            });

        }
    },
    hook_post_user_fetchall: {
        rank: 1,
        event: function (data) {
            if (data.post.apikey && data.post.secretkey) {

                hook('hook_secretkey_check', {
                    apikey: data.post.apikey,
                    secretkey: data.post.secretkey
                }, function (check) {
                    if (check.returns === true) {

                        hook('hook_db_find', {
                            dbcollection: 'users',
                            dbquery: {}
                        }, function (gotData) {

                            var userlist = gotData.returns;

                            var output = [];

                            JSON.parse(userlist).forEach(function (element) {

                                output[element.uid] = true;

                            });

                            data.returns = JSON.stringify(output);
                            process.emit('next', data);

                        });

                    } else {
                        process.emit('next', data);
                    }
                });
            }
        }
    }

};

module.exports = exports;