C.registerModule("entity_views");

var express = require('express');

//Register static directory

C.app.use("/entity_views", express.static(__dirname + '/static'));

CM.entity_views.registerHook("hook_entity_created", 0, function (thisHook, data) {

  C.sendSocketMessage(["*"], "entityUpdate", data);

});
