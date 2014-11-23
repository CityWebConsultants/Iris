/*jslint node: true */

"use strict";

var MongoClient = require('mongodb').MongoClient;

var exports = {
    options: {},
    hook_db_insert: {
        rank: 0,
        event:
            function (data) {
                var dbcollection = data.dbcollection,
                    dbobject = data.dbobject;
                console.log('got options: connection url ' + exports.options.connection_url);
                // Connect and push to database
                MongoClient.connect(exports.options.connection_url + exports.options.database_name, function (err, db) {
                    if (!err) {
                        console.log('Connected to database.');

                        var collection = db.collection(exports.options.prefix + dbcollection);
                        collection.insert(dbobject, function (err, result) {
                            console.log('Inserted object into database.');
                        });

                        db.close();
                        process.emit("next", data);

                    } else {
                        console.log('Database connection error!');
                        process.emit("next", data);
                    }
                });
            }
    },
    hook_db_find: {
        rank: 0,
        event:
            function (data) {
                
            }
    },
    hook_db_update: {
        rank: 0,
        event:
            function (data) {
                
            }
    }
};

module.exports = exports;
