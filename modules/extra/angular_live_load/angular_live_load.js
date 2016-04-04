/**
 * Implements hook_frontend_embed
 * Load in necessary JavaScript files on the client side if entity embed is present
 */

iris.modules.angular_live_load.registerHook("hook_frontend_embed__entity", 1, function (thisHook, data) {

  thisHook.context.vars.tags.headTags["socket.io"] = {
    type: "script",
    attributes: {
      "src": "/socket.io/socket.io.js"
    },
    rank: -1
  }

  thisHook.context.vars.tags.headTags["angular"] = {
    type: "script",
    attributes: {
      "src": "https://ajax.googleapis.com/ajax/libs/angularjs/1.5.0/angular.js"
    },
    rank: 0
  }

  thisHook.context.vars.tags.headTags["angular_live_load"] = {
    type: "script",
    attributes: {
      "src": "/modules/angular_live_load/angular_live_load_client.js"
    },
    rank: 1
  }

  thisHook.pass(data);

})
