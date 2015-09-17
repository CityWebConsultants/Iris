/**
 * Mustache
 *
 * Provides mustache template rendering for the template render stage.
 */

C.registerModule("mustache");

CM.mustache.registerHook("hook_frontend_template", 1, function (thisHook, data) {

var Mustache = require('mustache');

  try {

    data.html = Mustache.render(data.html, data.vars);

    thisHook.finish(true, data);

  } catch (e) {

    thisHook.finish(false, "Mustache rendering failed");

  }

});
