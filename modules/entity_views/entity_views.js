C.registerModule("entity_views");

var express = require('express');

//Register static directory

C.app.use("/entity_views", express.static(__dirname + '/static'));

CM.entity_views.registerHook("hook_entity_created", 0, function (thisHook, data) {

  C.hook("hook_entity_view_" + data.entityType, [data], thisHook.authPass).then(function (filtered) {

    C.sendSocketMessage(["*"], "entityCreate", filtered[0]);

  }, function (fail) {

    if (fail === "No such hook exists") {

      C.sendSocketMessage(["*"], "entityCreate", data);

    }

  });

});

CM.entity_views.registerHook("hook_entity_updated", 0, function (thisHook, data) {

  C.hook("hook_entity_view_" + data.entityType, [data], thisHook.authPass).then(function (filtered) {

    C.sendSocketMessage(["*"], "entityUpdate", filtered[0]);

  }, function (fail) {

    if (fail === "No such hook exists") {

      C.sendSocketMessage(["*"], "entityUpdate", data);

    }

  });

});

CM.entity_views.registerHook("hook_entity_deleted", 0, function (thisHook, data) {

  C.sendSocketMessage(["*"], "entityDelete", data);

});
