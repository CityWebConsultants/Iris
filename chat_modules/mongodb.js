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

var MongoClient = require('mongodb').MongoClient;

var exports = {
    options: {},
    hook_db_insert: {
        rank: 0,
        event:
            function (data) {
                var dbcollection = data.dbcollection,
                    dbobject = data.dbobject;
                
                // Connect & do.
                MongoClient.connect(exports.options.connection_url + exports.options.database_name, function (err, db) {
                    if (!err) {

                        var collection = db.collection(exports.options.prefix + dbcollection);
                        collection.insert(dbobject, function (err, result) {
                            data.returns = result;
                            process.emit('next', data);
                        });

                    } else {
                        console.log('[SEVERE] Database connection error!');
                        process.emit('next', data);
                    }
                });
            }
    },
    hook_db_find: {
        rank: 0,
        event:
            function (data) {
                var dbcollection = data.dbcollection,
                    dbquery = data.dbquery,
                    dbfindOne = data.dbfindOne;
                
                // Make sure the optional bool values are sane.
                if (dbfindOne !== true) {
                    dbfindOne = false;
                }
                
                // Connect & do.
                MongoClient.connect(exports.options.connection_url + exports.options.database_name, function (err, db) {
                    if (!err) {
                        var collection = db.collection(exports.options.prefix + dbcollection);
                        
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
                    } else {
                        console.log('[SEVERE] Database connection error!');
                        process.emit('next', data);
                    }
                });
            }
    },
    hook_db_update: {
        rank: 0,
        event:
            function (data) {
                var dbcollection = data.dbcollection,
                    dbquery = data.dbquery,
                    dbupdate = data.dbupdate,
                    dbmulti = data.dbmulti,
                    dbupsert = data.dbupsert;
                
                // Make sure the optional bool values are sane.
                if (dbmulti !== true) {
                    dbmulti = false;
                }
                
                if (dbupsert !== true) {
                    dbupsert = false;
                }
                
                // Connect & do.
                MongoClient.connect(exports.options.connection_url + exports.options.database_name, function (err, db) {
                    if (!err) {
                        var collection = db.collection(exports.options.prefix + dbcollection);
                        
                        collection.update(dbquery, dbupdate, {'upsert': dbupsert, 'multi': dbmulti}, function (err, docs) {
                            if (!err) {
                                data.returns = JSON.stringify(docs);
                            } else {
                                console.log(err);
                                data.returns = undefined;
                            }
                            process.emit('next', data);
                        });
                    } else {
                        console.log('[SEVERE] Database connection error!');
                        process.emit('next', data);
                    }
                });
            }
    }
};

module.exports = exports;
