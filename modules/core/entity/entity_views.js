/**
 * @file Functions and handlers for rendering and displaying entities to the user.
 */

var fs = require("fs");

require("./entity_embeds");

var updateEmbeds = function () {

  if (iris.modules.frontend.globals.liveEmbeds.entity) {

    Object.keys(iris.modules.frontend.globals.liveEmbeds.entity).forEach(function (embed) {

      iris.modules.frontend.globals.liveEmbeds.entity[embed].sendResult();

    })

  }

  // Clear query cache in same hook

  iris.modules.entity.globals.queryCache = {};

};

/**
 * @member hook_entity_created
 * @memberof entity
 *
 * @desc Event handling for when entities are created
 *
 * This hook is run once an entity has been created; useful for live updates or keeping track of changes
 */
iris.modules.entity.registerHook("hook_entity_created", 0, function (thisHook, entity) {

  updateEmbeds();

  for (var authUser in iris.modules.auth.globals.userList) {

    iris.modules.auth.globals.userList[authUser].getAuthPass().then(function (authPass) {

      iris.invokeHook("hook_entity_view", authPass, null, entity).then(function (data) {

        iris.sendSocketMessage([authPass.userid], "entityCreate", data);

      });

    }, function (fail) {

      thisHook.pass(fail);

    });
  }

  iris.invokeHook("hook_entity_view", {
    "userid": "anon",
    "roles": ["anonymous"]
  }, null, entity).then(function (data) {

    iris.sendSocketMessage(["anon"], "entityCreate", data);

  });

  thisHook.pass(entity);

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

  updateEmbeds();

  for (var authUser in iris.modules.auth.globals.userList) {

    iris.modules.auth.globals.userList[authUser].getAuthPass().then(function (authPass) {

      iris.invokeHook("hook_entity_view", authPass, null, entity).then(function (data) {

        iris.sendSocketMessage([authPass.userid], "entityUpdate", data);

      });

    }, function (fail) {

      thisHook.pass(fail);

    });
  }

  iris.invokeHook("hook_entity_view", {
    "userid": "anon",
    "roles": ["anonymous"]
  }, null, entity).then(function (data) {

    iris.sendSocketMessage(["anon"], "entityUpdate", data);

  });

  thisHook.pass(entity);

});

/**
 * @member hook_entity_deleted
 * @memberof entity
 *
 * @desc Event handling for when entities are deleted
 *
 * This hook is run when an entity is deleted; useful for live updates or keeping track of changes
 */
iris.modules.entity.registerHook("hook_entity_deleted", 0, function (thisHook, entity) {

  updateEmbeds();

  for (var authUser in iris.modules.auth.globals.userList) {

    iris.modules.auth.globals.userList[authUser].getAuthPass().then(function (authPass) {

      iris.invokeHook("hook_entity_view", authPass, null, entity).then(function (data) {

        iris.sendSocketMessage([authPass.userid], "entityDelete", data);

      });

    }, function (fail) {

      thisHook.pass(fail);

    });
  }

  iris.invokeHook("hook_entity_view", {
    "userid": "anon",
    "roles": ["anonymous"]
  }, null, entity).then(function (data) {

    iris.sendSocketMessage(["anon"], "entityDelete", data);

  });

  thisHook.pass(entity);

});
