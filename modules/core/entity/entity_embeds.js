/**
 * Implements hook_frontend_embed
 * Process entity embeds
 */

iris.modules.entity.registerHook("hook_frontend_embed__entity", 0, function (thisHook, data) {

  iris.invokeHook("hook_entity_fetch", thisHook.authPass, thisHook.context.embedOptions, thisHook.context.embedOptions).then(function (result) {

      var clientSideEntityLoader;

      if (thisHook.context.embedOptions.loadscripts || !thisHook.context.blockEmbed) {

        if (thisHook.context.embedOptions.variableName) {

          thisHook.context.embedID = thisHook.context.embedOptions.variableName;

        } else {

          thisHook.context.embedID = JSON.stringify(thisHook.context.embedOptions);

        }

        thisHook.context.vars.tags.headTags["entity_fetch"] = {
          type: "script",
          attributes: {
            "src": "/modules/entity/templates.js"
          },
          rank: 0
        };

        var entityPackage = "\n" + "iris.entityPreFetch(" + JSON.stringify(result) + ", '" + thisHook.context.embedID + "'" + ", " + JSON.stringify(thisHook.context.embedOptions) + ")";

        clientSideEntityLoader = "<script>" + entityPackage + "</script>";

      }
    
      thisHook.pass({
        content: clientSideEntityLoader,
        variables: [result],
        blockHeader: clientSideEntityLoader,
        blockFooter: ""
      });

    },
    function (error) {

      thisHook.pass(data);

    });

});
