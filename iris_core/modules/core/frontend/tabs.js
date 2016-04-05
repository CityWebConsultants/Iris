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

  var output = '';

  var output = '<ul id="tabs">';
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
        output += '<li class="' + activeClass + '"><a href="' + key + '">' + item.get.options.tab.title + '</a></li>';

      }

    }
    catch(ex) {

    }


  });

  output += '</ul>';

  thisHook.pass(output);

});
