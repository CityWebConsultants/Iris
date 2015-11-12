/**
 * Mustache
 *
 * Provides mustache template rendering for the template render stage.
 */

C.registerModule("mustache");

CM.mustache.registerHook("hook_frontend_template", 1, function (thisHook, data) {

  var Handlebars = require('handlebars');

  try {

    data.html = Handlebars.compile(data.html)(data.vars);

    thisHook.finish(true, data);

  } catch (e) {
    
    console.log(e);

    thisHook.finish(false, "Handlebars rendering failed");

  }

});
