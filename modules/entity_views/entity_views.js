C.registerModule("entity_views");

var express = require('express');


CM.entity_views.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("entity", data.html, function (entity, next) {

    var entityType = entity[0];
    var variableName = entity[1];
    var query = entity[2];

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

            C.log("debug", query[2]);
            C.log("error", e);

            queries[index] = undefined;
            return false;

          };

          queries[index] = ({

            field: query[0],
            comparison: query[1],
            compare: JSON.parse(query[2])

          });

        });

      }

      var fetch = {
        queries: queries,
        entities: [entityType]
      };

      C.hook("hook_entity_fetch", thisHook.authPass, null, {
        queryList: [fetch]
      }).then(function (result) {

        data.variables[variableName] = result;

        next("");

      }, function (error) {

        console.log(error);

        next("");

      });

    } else {

      next("");

    }

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    thisHook.finish(true, data);

  })

});


//Register static directory

C.app.use("/entity_views", express.static(__dirname + '/static'));

CM.entity_views.registerHook("hook_entity_created", 0, function (thisHook, entity) {

  C.hook("hook_entity_view", thisHook.authPass, null, entity).then(function (filtered) {

    C.hook("hook_entity_view_" + entity.entityType, thisHook.authPass, null, filtered).then(function (filtered) {

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

      C.hook("hook_entity_view_bulk", thisHook.authPass, null, [data]).then(function (data) {

        C.sendSocketMessage(["*"], "entityCreate", data[0]);

      });

    }

    thisHook.finish(true, data);

  };

});

CM.entity_views.registerHook("hook_entity_updated", 0, function (thisHook, entity) {

  C.hook("hook_entity_view", thisHook.authPass, null, entity).then(function (filtered) {

    C.hook("hook_entity_view_" + entity.entityType, thisHook.authPass, null, filtered).then(function (filtered) {

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

      C.hook("hook_entity_view_bulk", thisHook.authPass, null, [data]).then(function (data) {

        C.sendSocketMessage(["*"], "entityUpdate", data[0]);

      });

    } else {

      // When access permissions change or somesuch event happens
      // act as though the entity was deleted.
      C.sendSocketMessage(["*"], "entityDelete", {
        _id: entityId
      });

    }

    thisHook.finish(true, data);

  }

});

CM.entity_views.registerHook("hook_entity_deleted", 0, function (thisHook, data) {

  C.sendSocketMessage(["*"], "entityDelete", data);

});
