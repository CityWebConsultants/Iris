/**
 * @file Functions and handlers for rendering and displaying entities to the user.
 */

var fs = require("fs");

/**
 * Implements hook_frontend_embed
 * Process entity embeds
 */

iris.modules.entity.registerHook("hook_frontend_embed__entity", 0, function (thisHook, data) {
  
  iris.invokeHook("hook_entity_fetch", thisHook.authPass, null, thisHook.context.embedOptions).then(function (result) {
    
    thisHook.context.vars[thisHook.context.embedID] = result;

    thisHook.context.vars.tags.headTags["entity_fetch"] = {
      type: "script",
      attributes: {
        "src": "/modules/entity/templates.js"
      },
      rank: 0
    };

    var entityPackage = "\n" + "iris.entityPreFetch(" + JSON.stringify(result) + ", '" + thisHook.context.embedID + "'" + ", " + JSON.stringify(thisHook.context.embedOptions) + ")";

    var loader = entityPackage;

    thisHook.pass("<script>" + loader + "</script>");

  }, function (error) {

    thisHook.pass(data);

  });

});

/**
 * @member hook_entity_created
 * @memberof entity
 *
 * @desc Event handling for when entities are created
 *
 * This hook is run once an entity has been created; useful for live updates or keeping track of changes
 */
iris.modules.entity.registerHook("hook_entity_created", 0, function (thisHook, entity) {

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
