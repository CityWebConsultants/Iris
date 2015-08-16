C.registerModule("about");

var express = require('express');

//Register static directory

C.app.use(express.static(__dirname + '/static'));

require("./entityforms.js");

require("./permissions.js");

CM.about.registerHook("hook_entity_created", 0, function (thisHook, data) {
  
  C.sendSocketMessage(["*"], "entityUpdate", data);

});
