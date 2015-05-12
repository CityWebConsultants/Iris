/*jslint node: true */

"use strict";

/*  Updates Module
 *
 *  Intended for migration and update scripts
 */

var exports = {
    hook_update: {
        rank: 0,
        event: function (data) {

//                process.hook('hook_update_2015_05_12', {}, function (data) {});

                process.emit("next", data);

        }
    },
    hook_update_2015_05_12: {
        rank: 0,
        event:
            function (data) {

                setTimeout(function() {
                    process.hook('hook_db_update', {
                        dbcollection: 'groups',
                        dbquery: {
                            gidref: {$exists: true}
                        },
                        dbupdate: {
                            $rename: {
                                'gidref': 'entityref'
                            },
                            $set: {
                                'reftype': 'og'
                            }
                        },
                        dbupsert: false,
                        dbmulti: true
                    }, function (updateresult) {

                        console.log("-----------------------------------------------");
                        console.log("Updated gidref to entityref and reftype system.");
                        console.log("-----------------------------------------------");

                        process.emit("next", data);

                    });
                }, 1000);

            }

    },

};

module.exports = exports;
