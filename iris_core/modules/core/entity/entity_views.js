/**
 * @file Functions and handlers for rendering and displaying entities to the user.
 */

var fs = require("fs");

/*
 * This specific implementation of hook_frontend_template_parse processes entity blocks.
 */
iris.modules.entity.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {
    iris.modules.frontend.globals.parseEmbed("entity", data.html, function (entity, next) {

        var entityTypes = entity[0].split("+");
        var variableName = entity[1];
        var query = entity[2];
        var limit = entity[3];
        var sort = entity[4];

        if (query) {

            var queries = query.split("+");

            if (queries && queries.length) {

                queries.forEach(function (query, index) {

                    // Split query into sub sections

                    var query = query.split("|");

                    // Skip empty queries

                    if (!query[2]) {

                        queries[index] = undefined;
                        return false;

                    }

                    try {

                        JSON.parse(query[2]);

                    } catch (e) {

                        iris.log("debug", query[2]);
                        iris.log("error", e);

                        queries[index] = undefined;
                        return false;

                    };

                    queries[index] = ({

                        field: query[0],
                        operator: query[1],
                        value: JSON.parse(query[2])

                    });

                });

            }

        }

        var fetch = {
            queries: queries,
            entities: entityTypes,
        };

        if (limit) {

            fetch.limit = limit;

        }

        if (sort) {

            var expandedSort = {};

            expandedSort[sort.split("|")[0]] = sort.split("|")[1];

            fetch.sort = expandedSort;

        }

        iris.hook("hook_entity_fetch", thisHook.authPass, null, fetch).then(function (result) {

            data.variables[variableName] = result;

            data.variables.tags.headTags["entity_fetch"] = {
                type: "script",
                attributes: {
                    "src": "/modules/entity/templates.js"
                },
                rank: 0
            }

            var entityPackage = "\n" + "iris.entityPreFetch(" + JSON.stringify(result) + ", '" + variableName + "'" + ", " + JSON.stringify(fetch) + ")";

            var loader = entityPackage;

            next("<script>" + loader + "</script>");

        }, function (error) {

            console.log(error);

            next("");

        });

    }).then(function (html) {

        data.html = html;

        thisHook.finish(true, data);

    }, function (fail) {

        thisHook.finish(true, data);

    })

});

/**
 * @member hook_entity_created
 * @memberof entity
 *
 * @desc Event handling for when entities are created
 *
 * This hook is run once an entity has been created; useful for live updates or keeping track of changes
 */
iris.modules.entity.registerHook("hook_entity_created", 0, function (thisHook, entity) {

    for (var authUser in iris.modules.auth.globals.userList) {

        iris.modules.auth.globals.userList[authUser].getAuthPass().then(function (authPass) {
            console.log(authPass, "getAuthPass");
            iris.hook("hook_entity_view", authPass, null, entity).then(function (data) {
                console.log(authPass, "hook");
                iris.sendSocketMessage([authPass.userid], "entityCreate", data);

            });

        }, function (fail) {
            thisHook.finish(true, data);
        });
    }
    iris.hook("hook_entity_view", { "userid": "anon", "roles": ["anonymous"] }, null, entity).then(function (data) {
        console.log("anon");
        iris.sendSocketMessage(["anon"], "entityCreate", data);

    });

});

/**
 * @member hook_entity_updated
 * @memberof entity
 *
 * @desc Event handling for when entities are updated
 *
 * This hook is run when an entity is updated/edited; useful for live updates or keeping track of changes
 */
iris.modules.entity.registerHook("hook_entity_updated", 0, function (thisHook, entity) {
    for (var authUser in iris.modules.auth.globals.userList) {

        iris.modules.auth.globals.userList[authUser].getAuthPass().then(function (authPass) {
            console.log(authPass, "getAuthPass");
            iris.hook("hook_entity_view", authPass, null, entity).then(function (data) {
                console.log(authPass, "hook");
                iris.sendSocketMessage([authPass.userid], "entityUpdate", data);

            });

        }, function (fail) {
            thisHook.finish(true, data);
        });
    }
    iris.hook("hook_entity_view", { "userid": "anon", "roles": ["anonymous"] }, null, entity).then(function (data) {
        console.log("anon");
        iris.sendSocketMessage(["anon"], "entityUpdate", data);

    });

});

/**
 * @member hook_entity_deleted
 * @memberof entity
 *
 * @desc Event handling for when entities are deleted
 *
 * This hook is run when an entity is deleted; useful for live updates or keeping track of changes
 */
iris.modules.entity.registerHook("hook_entity_deleted", 0, function (thisHook, data) {

    for (var authUser in iris.modules.auth.globals.userList) {

        iris.modules.auth.globals.userList[authUser].getAuthPass().then(function (authPass) {
            console.log(authPass, "getAuthPass");
            iris.hook("hook_entity_view", authPass, null, entity).then(function (data) {
                console.log(authPass, "hook");
                iris.sendSocketMessage([authPass.userid], "entityDelete", data);

            });

        }, function (fail) {
            thisHook.finish(true, data);
        });
    }
    iris.hook("hook_entity_view", { "userid": "anon", "roles": ["anonymous"] }, null, entity).then(function (data) {
        console.log("anon");
        iris.sendSocketMessage(["anon"], "entityDelete", data);

    });

});
