C.registerModule("entity_views");

var express = require('express');

//Register static directory

C.app.use("/entity_views", express.static(__dirname + '/static'));

CM.entity_views.registerHook("hook_entity_created", 0, function (thisHook, data) {

  C.hook("hook_entity_view", [data], thisHook.authPass).then(function (data) {

    C.hook("hook_entity_view_" + data.entityType, [data], thisHook.authPass).then(function (filtered) {

      send(filtered[0]);

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

      C.sendSocketMessage(["*"], "entityCreate", data);

    }

    thisHook.finish(true, data);

  };

});

CM.entity_views.registerHook("hook_entity_updated", 0, function (thisHook, data) {

  var entityId = data._id;

  C.hook("hook_entity_view", [data], thisHook.authPass).then(function (data) {

    C.hook("hook_entity_view_" + data.entityType, [data], thisHook.authPass).then(function (filtered) {

      send(filtered[0]);

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

      C.sendSocketMessage(["*"], "entityUpdate", data);

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
