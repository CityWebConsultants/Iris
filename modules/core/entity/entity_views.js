/**
 * @file Functions and handlers for rendering and displaying entities to the user.
 */

var fs = require("fs");

/**
 * Implements hook_frontend_embed
 * Process entity embeds
 */

iris.modules.entity.registerHook("hook_frontend_embed__entity", 0, function (thisHook, data) {

  iris.invokeHook("hook_entity_fetch", thisHook.authPass, thisHook.context, thisHook.context.embedOptions).then(function (result) {

    thisHook.context.vars[thisHook.context.embedID] = result;

    thisHook.context.vars.tags.headTags["socket.io"] = {
      type: "script",
      attributes: {
        "src": "/socket.io/socket.io.js"
      },
      rank: -1
    }

    thisHook.context.vars.tags.headTags["handlebars"] = {
      type: "script",
      attributes: {
        "src": "/modules/entity/handlebars.min.js"
      },
      rank: -1
    }

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

  /*for (var authUser in iris.modules.auth.globals.userList) {

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

  });*/

  iris.modules.entity.globals.checkAllTemplates(entity);

  thisHook.pass(entity);

});

iris.modules.entity.globals.checkAllTemplates = function(entity) {

  var checkTemplate = function(entity, template) {

    var queries = template.queries, outcome = true;

    queries.forEach(function (query) {

      //Process query based on operator

      switch (query.operator) {

        case "IS":

          if (entity[query.field] !== query.operator) {

            outcome = false;

          }
          break;
        case "INCLUDES":

          if (entity[query.field].indexOf(query.operator) === -1) {

            outcome = false;

          }
          break;

        case "CONTAINS":

          if (entity[query.field].toString().toLowerCase().indexOf(query.operator.toString().toLowerCase()) === -1) {

            outcome = false;

          }
          break;
      }

    });

    return outcome;

  }

  Object.keys(iris.modules.auth.globals.templates).forEach(function(template) {

    if (iris.modules.auth.globals.templates[template].entities.indexOf(entity.entityType) > -1) {

      var hit = checkTemplate(entity, iris.modules.auth.globals.templates[template]);

      if (hit) {

        iris.modules.auth.globals.templates[template].users.forEach(function (user) {

          iris.modules.auth.globals.userList[user].getAuthPass().then(function (authPass) {

            iris.invokeHook("hook_entity_view", authPass, null, entity).then(function (data) {

              iris.sendSocketMessage([authPass.userid], "entityCreate", {data: data, template: template});

            });

          });

        });

      }

    }

  });

}


/**
 * @member hook_entity_updated
 * @memberof entity
 *
 * @desc Event handling for when entities are updated
 *
 * This hook is run when an entity is updated/edited; useful for live updates or keeping track of changes
 */
iris.modules.entity.registerHook("hook_entity_updated", 0, function (thisHook, entity) {

  /*for (var authUser in iris.modules.auth.globals.userList) {

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

  });*/

  iris.modules.entity.globals.checkAllTemplates(entity);

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
