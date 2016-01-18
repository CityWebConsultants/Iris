/**
 * @file Functions and handlers for rendering and displaying entities to the user.
 */

var UglifyJS = require("uglify-js");
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

    iris.hook("hook_entity_fetch", thisHook.authPass, null, {
      queryList: [fetch]
    }).then(function (result) {

      data.variables[variableName] = result;

      var toSource = require('tosource');

      var clientSideScript = toSource(function entityLoad(result, variableName, query) {

        if (variableName) {
          result ? null : result = [];
          window.iris ? null : window.iris = {};
          window.iris.fetchedEntities ? null : window.iris.fetchedEntities = {};
          window.iris.fetched ? null : window.iris.fetched = {};
          window.iris.fetched[variableName] = {
            query: query,
            entities: []
          };
          result.forEach(function (entity) {

            window.iris.fetchedEntities[entity.entityType] ? null : window.iris.fetchedEntities[entity.entityType] = {};

            window.iris.fetchedEntities[entity.entityType][entity.eid] = entity;
            window.iris.fetched[variableName].entities.push(entity);

          })

        }

      });

      var preLoader = "";

      data.variables.tags.headTags["entity_fetch"] = {
        type: "script",
        attributes: {
          "src": "/modules/entity/templates.js"
        },
        rank: 0
      }

      var entityPackage = clientSideScript + "; \n" + "entityLoad(" + JSON.stringify(result) + ", '" + variableName + "'" + ", " + JSON.stringify(fetch) + ")";

      var loader = UglifyJS.minify(entityPackage, {
        fromString: true
      });

      next(preLoader + "<script>" + loader.code + "</script>");

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

  iris.hook("hook_entity_view", thisHook.authPass, null, entity).then(function (filtered) {

    iris.hook("hook_entity_view_" + entity.entityType, thisHook.authPass, null, filtered).then(function (filtered) {

      send(filtered);

    }, function (fail) {

      if (fail === "No such hook exists") {

        send(filtered);

      } else {

        thisHook.finish(true, filtered);

      }

    });

  });

  var send = function (data) {

    if (data) {

      iris.hook("hook_entity_view_bulk", thisHook.authPass, null, [data]).then(function (data) {

        iris.sendSocketMessage(["*"], "entityCreate", data[0]);

      });

    }

    thisHook.finish(true, data);

  };

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

  iris.hook("hook_entity_view", thisHook.authPass, null, entity).then(function (filtered) {

    iris.hook("hook_entity_view_" + entity.entityType, thisHook.authPass, null, filtered).then(function (filtered) {

      send(filtered);

    }, function (fail) {

      if (fail === "No such hook exists") {

        send(filtered);

      } else {

        thisHook.finish(true, data);

      }

    });

  }, function (fail) {

    thisHook.finish(true, data);

  });

  var send = function (data) {

    if (data) {

      iris.hook("hook_entity_view_bulk", thisHook.authPass, null, [data]).then(function (data) {

        iris.sendSocketMessage(["*"], "entityUpdate", data[0]);

      });

    } else {

      // When access permissions change or somesuch event happens
      // act as though the entity was deleted.
      iris.sendSocketMessage(["*"], "entityDelete", {
        _id: entityId
      });

    }

    thisHook.finish(true, data);

  }

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

  iris.sendSocketMessage(["*"], "entityDelete", data);

});
