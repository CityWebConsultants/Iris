/*jslint node: true */
"use strict";
var MongoClient = require('mongodb').MongoClient;

var exports = {
    options: {},
    hook_post_group_add: {
        rank: 0,
        event:
            function (data) {
                var url = data.url,
                    post = data.post,
                    groupMembers = [],
                    groupMembersValid = true,
                    currentDate = Date.now();

                // Validate POSTed data

                // Force it to be an array
                if (post.members.constructor !== Array) {
                    groupMembers[0] = post.members;
                } else {
                    groupMembers = post.members;
                }

                // Foreach item, check for a numeric uid (could make this configurable as to what is a valid uid)
                groupMembers.forEach(function (element, index) {
                    if (isNaN(element) || element === '') {
                        groupMembersValid = false;
                    }
                });

                // If no name supplied, make it blank.
                if (!post.name) {
                    post.name = '';
                }

                // If invalid, return fail
                if (groupMembersValid !== true) {
                    data.returns = 'invalid user id(s)';
                    // Pass on to the next handler in case it can still salvage this :)
                    process.emit("next", data);
                    return;
                }

                // Create array of members
                var membersArray = [];

                groupMembers.forEach(function (element, index) {
                    membersArray.push({uid: element, joined: currentDate});
                });

                // Call database insert hook to insert the new group object
                process.hook('hook_db_insert', {dbcollection: 'groups', dbobject: {'members': membersArray, 'name': post.name}});
                
                process.emit("next", data);
            }
    },
    hook_get_fetch_group: {
        rank: 0,
        event:
            function (data) {
                var get = data.get;
                
                // Call db find hook.
                console.log('does this run');
                process.hook('hook_db_find', {dbcollection: 'groups', dbquery: {}, callback: function (gotData) {
                    console.log(gotData);
                    
                    
                    
                    data.returns = gotData.results;
                    process.emit("next", data);
                    }
                });
                
                process.emit('next', data);
            }
    }
};

module.exports = exports;
