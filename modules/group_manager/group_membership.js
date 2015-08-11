//Register add member hook and post call to send to it

CM.group_manager.registerHook("hook_group_manager_addmember", 0, function (thisHook, data) {

  //First check if group exists
  CM.group_manager.globals.findGroupByID(data._id).then(function (found) {

    thisHook.finish(true, "Group found");

  }, function (fail) {

    thisHook.finish(false, "No such group");

  });

});

C.app.post("/group/addmember", function (req, res) {

  C.hook("hook_group_manager_addmember", req.body, req.authPass).then(function (pass) {

    res.send(pass);

  }, function (fail) {

    res.send(fail);

  });

});
