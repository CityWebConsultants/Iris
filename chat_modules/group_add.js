var MongoClient = require('mongodb').MongoClient;

var exports = {
    options: {},
    rest:
        function (res, post) {
            console.log(post);
            var groupMembers = [];
            var groupMembersValid = true;
            
            var currentDate = Date.now();
            
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
                res.end('invalid user id(s)');
                return;
            }
            
            console.log('Input ok');
            
            // Create array of members
            var membersArray = [];
            
            groupMembers.forEach(function (element, index) {
                membersArray.push({uid: element, joined: currentDate});
            });
            
            // Connect and push to database
            MongoClient.connect('mongodb://localhost:27017/chat-app', function (err, db) {
                if (!err) {
                    console.log('Connected to database.');
                    
                    var collection = db.collection('groups');
                    collection.insert({'members': membersArray, 'name': post.name}, function (err, result) {
                        console.log('Inserted group into database.');
                    });
                    
                    db.close();
                    
                    res.end('Successfully created group ' + JSON.stringify({members: membersArray, name: post.name}));
                    
                } else {
                    console.log('Database connection error!');
                    
                    res.end('500 Internal Server Error');
                    return;
                }
            });
        }
};

module.exports = exports;
