/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

/**
 * @member hook_frontend_embed__tags
 * @memberof frontend
 *
 * @desc Parses embeded client side tags such as JavaScript, CSS and meta tags
 *
 */
iris.modules.frontend.registerHook("hook_frontend_embed__tabs", 0, function (thisHook, data) {

  var list = [];
  Object.keys(iris.routes).forEach(function(key) {

    try {

      var item = iris.routes[key];

      if (item.get.options.tab.parent == thisHook.context.vars.req.irisRoute.options.tab.parent) {

        var activeClass = '';
        if (thisHook.context.vars.req.route.path == key) {
          activeClass = 'active';
        }
        Object.keys(thisHook.context.vars.req.params).forEach(function (param) {
          key = key.replace(':' + param, thisHook.context.vars.req.params[param]);
        });
        list.push({link: key, title: item.get.options.tab.title, class: activeClass});


      }

    }
    catch(ex) {

    }

  });

  // Render admin_schema_field template.
  iris.modules.frontend.globals.parseTemplateFile(["tabs"], null, {
    list: list
  }, thisHook.authPass, thisHook.context.vars.req).then(function (output) {

    thisHook.pass(output);

  }, function (fail) {

    thisHook.fail(fail);

    iris.log("error", fail);

  });



});
