/**
 * @file Provides hooks and functions to create forms for use on the frontend
 */

/**
 * @namespace forms
 */

iris.registerModule("forms", __dirname);

// Store of rendered form keys to check if form has already been submitted and stop cross site scripting problems with re-rendered forms

iris.modules.forms.globals.formRenderCache = {};

// Clear formRenderCache every 24 hours. TODO this is a tiny memory leak but it could add up on huge sites, needs a proper way of invalidating a form.

setInterval(function () {

  Object.keys(iris.modules.forms.globals.formRenderCache).forEach(function (cacheItem) {

    var date = iris.modules.forms.globals.formRenderCache[cacheItem].date;

    if ((Date.now() - date) > 86400000) {

      delete iris.modules.forms.globals.formRenderCache[cacheItem];

    }

  });

}, 86400000);

require("./embed.js");
require("./submit.js");
require("./fields.js");
