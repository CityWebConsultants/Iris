C.registerModule("entity_views");

var express = require('express');

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

        send(data);

      } else {

        thisHook.finish(true, data);

      }

    });

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
