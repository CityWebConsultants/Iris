/*jslint node: true nomen: true*/

"use strict";

C.registerModule("entity");

//Checking if a user can create an entity of a particular type

C.app.get("/access/create/:type", function (req, res) {

  C.hook("hook_entity_access_create", req.params.type, req.authPass).then(function (success) {

    C.hook("hook_entity_access_create_" + req.params.type, req.params.type, req.authPass).then(function (success) {

      console.log("Success");

    }, function (fail) {

      if (fail === "No such hook exists") {

        res.send(success);

      } else {

        console.log(fail);
        res.send(fail);

      }

    })

  }, function (fail) {

    console.log(fail);
    res.send(fail);

  });

});

//Checking access and if entity exists

CM.entity.registerHook("hook_entity_access_create", 0, function (thisHook, entityType) {
  
  if (C.dbCollections[entityType]) {

    thisHook.finish(true, entityType);

  } else {

    thisHook.finish(false, "Entity type doesn't exist");

  }

});

