iris.registerModule("sessions",__dirname);

iris.app.get("/checkauth", function (req, res) {

  res.respond(200, req.authPass.userid);

});

iris.modules.sessions.registerHook("hook_entity_deleted", 1, function (thisHook, entity) {
  
  if (entity.entityType === "user") {

    delete iris.modules.auth.globals.userList[entity.eid];

  }

  thisHook.pass(entity);

});
