/*jslint node: true */

"use strict";

/*  MongoDB Module
 *
 *  Provides a set of database hooks for MongoDB.
 *
 *  Implements these base hooks:
 *
 *  hook_db_insert
 *  hook_db_find
 *  hook_db_update
 */

var MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    dbClient,
    gdb;

var exports = {
    options: {},
    init:
        function () {
            dbClient = new MongoClient(new Server(exports.options.server, exports.options.port), function (err, db) {
                if (err) {
                    console.log("[SEVERE] Database connection failure!");
                    console.log(err);
                }
            });

            // Open connection
            dbClient.open(function (err, dbClient) {
                gdb = dbClient.db(exports.options.database_name);
            });
        },
    hook_db_insert: {
        rank: 0,
        event:
            function (data) {
                var dbobject = data.dbobject,
                    collection = gdb.collection(exports.options.prefix + data.dbcollection);

                collection.insert(dbobject, function (err, result) {
                    data.returns = result;
                    process.emit('next', data);
                });

            }
    },
    hook_db_find: {
        rank: 0,
        event:
            function (data) {
                var dbquery = data.dbquery,
                    dbfindOne = data.dbfindOne,
                    collection = gdb.collection(exports.options.prefix + data.dbcollection);
                
                // Make sure the optional bool values are sane.
                if (dbfindOne !== true) {
                    dbfindOne = false;
                }

                if (dbfindOne === true) {
                    collection.findOne(dbquery).toArray(function (err, result) {
                        data.returns = JSON.stringify(result);
                        process.emit('next', data);
                    });
                } else {
                    collection.find(dbquery).toArray(function (err, result) {
                        data.returns = JSON.stringify(result);
                        process.emit('next', data);
                    });
                }
            }
    },
    hook_db_update: {
        rank: 0,
        event:
            function (data) {
                var dbquery = data.dbquery,
                    dbupdate = data.dbupdate,
                    dbmulti = data.dbmulti,
                    dbupsert = data.dbupsert,
                    collection = gdb.collection(exports.options.prefix + data.dbcollection);
                
                // Make sure the optional bool values are sane.
                if (dbmulti !== true) {
                    dbmulti = false;
                }
                
                if (dbupsert !== true) {
                    dbupsert = false;
                }

                collection.update(dbquery, dbupdate, {'upsert': dbupsert, 'multi': dbmulti}, function (err, docs) {
                    if (!err) {
                        data.returns = JSON.stringify(docs);
                    } else {
                        console.log(err);
                        data.returns = undefined;
                    }
                    process.emit('next', data);
                });

            }
    },
    hook_db_remove: {
        rank: 0,
        event: function (data) {
            var dbquery = data.dbquery,
                collection = gdb.collection(exports.options.prefix + data.dbcollection);

            collection.remove(dbquery, function (err, docs) {
                if (!err) {
                    data.returns = JSON.stringify(docs);
                } else {
                    console.log(err);
                    data.returns = undefined;
                }
                process.emit('next', data);
            });
        }
    }
};

module.exports = exports;
